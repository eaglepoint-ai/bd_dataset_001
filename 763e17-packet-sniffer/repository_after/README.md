# Flow Sniffer

A network packet sniffer that captures traffic, groups packets into flows, and extracts statistical features for each flow. Perfect for network traffic analysis and generating datasets for ML-based traffic classification.

## Features

- **Packet Capture**: Captures network packets using scapy
- **Flow Tracking**: Groups packets into bidirectional flows based on 5-tuple (src_ip, dst_ip, src_port, dst_port, protocol)
- **Feature Extraction**: Extracts 19 statistical features from each flow including:
  - Forward/backward packet statistics (length, IAT, counts)
  - TCP flag counts (SYN, FIN, PSH, URG, etc.)
  - Header length statistics
  - Segment size statistics

## Installation

```bash
pip install -r requirements.txt
```

**Note**: Packet capture requires root/administrator privileges.

## Usage

### Command Line

```bash
# Capture all traffic
sudo python main.py

# Capture only TCP traffic
sudo python main.py --filter "tcp"

# Capture HTTP traffic
sudo python main.py --filter "port 80"

# Capture 100 packets then stop
sudo python main.py --count 100

# Output as JSON
sudo python main.py --json

# Quiet mode (features only)
sudo python main.py --quiet
```

### As a Library

```python
from sniffer import FlowSniffer, Config

# Create sniffer with custom config
config = Config(
    active_timeout=120,      # Max flow duration (seconds)
    inactivity_timeout=10,   # Idle timeout (seconds)
)
sniffer = FlowSniffer(config=config)

# Custom callback for completed flows
def on_flow_complete(result):
    flow_data = result["flow_data"]
    features = result["features"]
    
    print(f"Flow: {flow_data['source_ip']} -> {flow_data['destination_ip']}")
    print(f"Features: {features}")

# Start sniffing
sniffer.start_sniffing(
    callback=on_flow_complete,
    filter_str="tcp",
    count=0  # 0 = infinite
)
```

### Generator Mode

```python
from sniffer import FlowSniffer

sniffer = FlowSniffer()

# Iterate over completed flows
for result in sniffer.sniff_flows(filter_str="tcp", count=100):
    features = result["features"]
    # Process features...
```

## Extracted Features

| Feature Name | Description |
|--------------|-------------|
| Dst Port | Destination port |
| Fwd Pkt Len Std | Forward packet length standard deviation |
| Bwd Pkt Len Max | Maximum backward packet length |
| Bwd Pkt Len Mean | Mean backward packet length |
| Bwd Pkt Len Std | Backward packet length standard deviation |
| Flow IAT Mean | Mean inter-arrival time |
| Flow IAT Std | IAT standard deviation |
| Bwd IAT Mean | Mean backward IAT |
| Fwd PSH Flags | Forward PSH flag count |
| Fwd Header Len | Forward header length |
| Bwd Pkts/s | Backward packets per second |
| Fwd Seg Size Min | Minimum forward segment size |
| FIN Flag Cnt | FIN flag count |
| SYN Flag Cnt | SYN flag count |
| URG Flag Cnt | URG flag count |
| Init Fwd Win Byts | Initial forward window bytes |
| Init Bwd Win Byts | Initial backward window bytes |
| Tot Bwd Pkts | Total backward packets |
| TotLen Bwd Pkts | Total backward packet length |

## Project Structure

```
sniffer/
├── __init__.py          # Package exports
├── config.py            # Configuration
├── packet.py            # Packet wrapper (abstracts scapy)
├── flow.py              # Flow and FlowManager classes
├── analysis/
│   ├── features.py      # Feature extraction
│   ├── statistics.py    # Statistical calculations
│   └── flags.py         # TCP flag analysis
└── network/
    └── sniffer.py       # FlowSniffer main class
```

## License

MIT
