import socket
import netifaces
import ipaddress

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

