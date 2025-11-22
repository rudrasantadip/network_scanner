from flask import Blueprint, jsonify
from utils.scanner_utils import host_ip,network_info

scanner_bp = Blueprint("scanner",__name__,url_prefix="/scanner")

@scanner_bp.route("/host/ip")
def get_host_ip():
    return jsonify({"ip":host_ip()})

@scanner_bp.route("/host/network-info")
def get_network_info():
    return jsonify(network_info())