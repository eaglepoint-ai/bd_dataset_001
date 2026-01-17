"""
Main entry point for the Flow Sniffer.

Captures network packets, groups them into flows, and extracts features.
"""

import argparse
import json
from sniffer import FlowSniffer, Config


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Flow Sniffer - Network Flow Feature Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  sudo python main.py                     # Capture all traffic
  sudo python main.py --filter "tcp"      # Capture only TCP traffic
  sudo python main.py --filter "port 80"  # Capture HTTP traffic
  sudo python main.py --count 100         # Capture 100 packets then stop
  sudo python main.py --json              # Output features as JSON
        """
    )
    
    parser.add_argument(
        "--filter",
        type=str,
        default=None,
        help="BPF filter string for packet capture (e.g., 'tcp', 'port 80')"
    )
    
    parser.add_argument(
        "--count",
        type=int,
        default=0,
        help="Number of packets to capture (0 = infinite, default: 0)"
    )
    
    parser.add_argument(
        "--active-timeout",
        type=int,
        default=120,
        help="Maximum time (seconds) a flow can be active (default: 120)"
    )
    
    parser.add_argument(
        "--inactivity-timeout",
        type=int,
        default=10,
        help="Time (seconds) of inactivity before flow expires (default: 10)"
    )
    
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output flow features as JSON"
    )
    
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Only output flow features, no status messages"
    )
    
    args = parser.parse_args()
    
    # Create config
    config = Config(
        active_timeout=args.active_timeout,
        inactivity_timeout=args.inactivity_timeout,
    )
    
    # Create sniffer
    sniffer = FlowSniffer(config=config)
    
    # Define callback based on output format
    if args.json:
        def callback(result):
            output = {
                "source_ip": result["flow_data"]["source_ip"],
                "destination_ip": result["flow_data"]["destination_ip"],
                "source_port": result["flow_data"]["source_port"],
                "destination_port": result["flow_data"]["destination_port"],
                "protocol": result["flow_data"]["protocol"],
                "features": result["features"],
                "timestamp": result["timestamp"],
            }
            print(json.dumps(output))
    elif args.quiet:
        def callback(result):
            features = result["features"]
            print(features)
    else:
        callback = None  # Use default callback
    
    if not args.quiet:
        print("Flow Sniffer - Network Flow Feature Generator")
        print("=" * 50)
        print(f"Config: active_timeout={config.active_timeout}s, inactivity_timeout={config.inactivity_timeout}s")
        if args.filter:
            print(f"Filter: {args.filter}")
        if args.count > 0:
            print(f"Capturing {args.count} packets...")
        else:
            print("Capturing indefinitely (Ctrl+C to stop)...")
        print("=" * 50)
        print()
    
    try:
        sniffer.start_sniffing(
            callback=callback,
            filter_str=args.filter,
            count=args.count
        )
    except KeyboardInterrupt:
        if not args.quiet:
            print("\nStopping capture...")
            print(f"Active flows: {sniffer.get_active_flow_count()}")
            print(f"Completed flows: {sniffer.get_completed_flow_count()}")


if __name__ == "__main__":
    main()
