from scapy.all import ARP, Ether, srp

def arp_scan(network, iface):
    arp = ARP(pdst=network)
    ether = Ether(dst="ff:ff:ff:ff:ff:ff")  # broadcast

    packet = ether / arp

    print(f"Scanning {network} on interface {iface}...\n")

    # srp = Send & Receive Packets at Layer 2
    result = srp(packet, iface=iface, timeout=2, verbose=0)[0]

    alive_hosts = []

    for sent, received in result:
        alive_hosts.append({
            "ip": received.psrc,
            "mac": received.hwsrc
        })

    return alive_hosts


if __name__ == "__main__":
    network = "192.168.0.0/24" 
    iface = "Wi-Fi"              

    nodes = arp_scan(network, iface)

    print("=== Active Hosts ===")
    for host in nodes:
        print(f"{host['ip']}  -->  {host['mac']}")
