from flask import Blueprint, Response, jsonify, request
from utils.scanner_utils import host_ip, network_info, scan_network,ping, scan_port
from concurrent.futures import ThreadPoolExecutor, as_completed
import json

scanner_bp = Blueprint("scanner",__name__,url_prefix="/scanner")

@scanner_bp.route("/host/ip")
def get_host_ip():
    return jsonify({"ip":host_ip()})

@scanner_bp.route("/host/network-info")
def get_network_info():
    return jsonify(network_info())

@scanner_bp.route("/scan",methods=["GET"])
def get_scan_info():
    devices = scan_network()
    return jsonify(devices)

@scanner_bp.route("ping",methods=["GET"])
def ping_ip():
    ip = request.args.get("ip")
    result = ping(ip)
    return jsonify(result)

@scanner_bp.route("portscan", methods = ["GET"])
def port_scan():
    ip = request.args.get("ip")
    ports = request.args.get("ports",None)

    if not ip:
        return jsonify({"error":"Ip is required"})
    
    if ports:
        try:
            port_list = [int(p.strip()) for p in ports.split(",") if p.strip().isdigit()]
        except ValueError:
            return jsonify({"error":"Invalid ports parameter"})
    
    else:
        port_list=[22,53,80,443,3306,8080]
    
    results=[]

    with ThreadPoolExecutor(max_workers=100) as executor:
        futures = {executor.submit(scan_port,ip,p,0.5): p for p in port_list}

        for fut in as_completed(futures):
            port, is_open = fut.result()
            results.append({"port":port,"open":is_open})
    
    results_sorted = sorted(results, key=lambda x: x["port"])

    return jsonify({"ip":ip, "results":results_sorted})


@scanner_bp.route("/portscan/full",methods = ["GET"])
def full_port_scan():
    ip = request.args.get("ip")

    if not ip:
        return jsonify({"error": "IP is required"}), 400

    TOTAL = 65535

    def generate():
        scanned = 0
        open_ports = []
        ports = range(1, TOTAL + 1)

        with ThreadPoolExecutor(max_workers=200) as executor:
            futures = {
                executor.submit(scan_port, ip, port, 0.12): port
                for port in ports
            }

            for future in as_completed(futures):
                port, is_open = future.result()
                scanned += 1

                if is_open:
                    open_ports.append(port)

                progress = (scanned / TOTAL) * 100

                yield f"data: {json.dumps({ \
                    'progress': round(progress, 2), \
                    'scanned': scanned, \
                    'total': TOTAL, \
                    'current_port': port \
                })}\n\n"

        # FINAL MESSAGE
        yield f"data: {json.dumps({'done': True, 'open_ports': open_ports})}\n\n"

    return Response(generate(), mimetype="text/event-stream")
