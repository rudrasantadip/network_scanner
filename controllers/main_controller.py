from flask import Blueprint, render_template , request

main_bp = Blueprint('main',__name__)

@main_bp.route("/")
def index():
    return render_template("index.html")

@main_bp.route("/ping")
def ping_page():
    ip = request.args.get("ip","")
    return render_template("ping.html",ip=ip)

@main_bp.route("/portscan")
def port_scan_page():
    ip = request.args.get("ip","")
    return render_template("portscan.html",ip=ip)