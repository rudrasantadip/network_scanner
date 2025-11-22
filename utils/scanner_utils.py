import platform
import socket
import subprocess
import netifaces
import ipaddress


from scapy.all import ARP,Ether,srp
from mac_vendor_lookup import MacLookup

def host_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8",80))
        ip = s.getsockname()[0]
    finally:
        s.close()
    return ip



def netmask_to_cidr(netmask):
    return ipaddress.IPv4Network(f"0.0.0.0/{netmask}").prefixlen



def network_info():
    info={
        "interfaces": {},
        "gateway": None,
        "interface_names": netifaces.interfaces()
    }

    gateways = netifaces.gateways()
    default_gw = gateways.get("default",{})

    if netifaces.AF_INET in default_gw:
        info["gateway"] = default_gw[netifaces.AF_INET][0]


    for interface in netifaces.interfaces():
        addrs = netifaces.ifaddresses(interface)

        if netifaces.AF_INET not in addrs:
            continue

        ipv4 = addrs[netifaces.AF_INET][0]
        ip = ipv4.get("addr")
        netmask = ipv4.get("netmask")
        broadcast = ipv4.get("broadcast")

        iface_entry = {
            "interface": interface,
            "ip": ip,
            "netmask": netmask,
            "broadcast": broadcast,
            "cidr": netmask_to_cidr(netmask) if netmask else None,
        }

        if netifaces.AF_LINK in addrs:
            iface_entry["mac"] = addrs[netifaces.AF_LINK][0].get("addr")

        info["interfaces"][interface] = iface_entry
    return info


def primary_interface():
    interfaces = netifaces.interfaces()

    for i in interfaces:
        addrs = netifaces.ifaddresses(i)
     

        if netifaces.AF_INET not in addrs:
            continue

        ipv4 = addrs[netifaces.AF_INET][0]
        ip = ipv4.get("addr")


        if (
            ip.startswith("127.") or
            ip.startswith("169.254.") or
            ip.startswith("192.168.56.") or 
            ip.startswith("192.168.80.") or 
            ip.startswith("192.168.190.")
        ):
            continue

        netmask = ipv4.get("netmask")
    
        return ip, netmask
    


def scan_network():
    """
    Scan the entire subnet using ARP.
    Returns list of devices: IP, MAC.

    """
    # MacLookup().update_vendors()  # download OUI file automatically


    host_ip, netmask = primary_interface()
    lookup = MacLookup()

    if not host_ip or not netmask:
        return "Unable to detect primary interface"
    
    cidr = netmask_to_cidr(netmask)
    network_range = f"{host_ip}/{cidr}"
    
    #build ARP request

    arp = ARP(pdst=network_range)
    ether = Ether(dst="ff:ff:ff:ff:ff:ff")

    packet = ether/arp

    result = srp(packet,timeout=2,verbose=0)[0]
    devices=[]

    for send,recieved in result:
        devices.append({
            "ip":recieved.psrc,
            "mac":recieved.hwsrc,
            # "vendor":lookup.lookup(recieved.hwsrc),
            "online":True  
        })
    
    return (devices)

def ping(ip):
    param = "-n" if platform.system().lower() == "windows" else "-c"
    cmd = ["ping", param, "4" , ip]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=6)
        return {
            "ip":ip,
            "output":result.stdout
        }
    except Exception as e:
        return {
            "error":str(e)
        }



def scan_port(ip,port,timeout=0.5):
    """
    Try TCP connect to ip:port. Return (port, True/False).
    Uses connect_ex which returns 0 on success.
    """
    try:
        with socket.socket(socket.AF_INET,socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            res = s.connect_ex((ip,port))
            return port, (res==0)
    
    except Exception:
        return port,False