use ipnetwork::Ipv4Network;
use wasm_bindgen::prelude::*;
use gloo_utils::format::JsValueSerdeExt;

#[derive(serde::Serialize)]
struct IpRange {
    subnet_mask: String,
    wildcard_mask: String,
    broadcast_address: String,
    network_address: String,
    first_ip: String,
    last_ip: String,
    assignable_hosts: String,
}

#[wasm_bindgen]
pub fn compare_cidr_networks(left_cidr: &str, right_cidr: &str) -> bool {
    let left_network = match left_cidr.parse::<Ipv4Network>() {
        Ok(n) => n,
        Err(_) => match left_cidr.parse::<Ipv4Network>() {
            Ok(n) => n,
            Err(e) => panic!("Invalid CIDR notation: {}", e),
        },
    };

    let right_network = match right_cidr.parse::<Ipv4Network>() {
        Ok(n) => n,
        Err(_) => match right_cidr.parse::<Ipv4Network>() {
            Ok(n) => n,
            Err(e) => panic!("Invalid CIDR notation: {}", e),
        },
    };

    left_network.overlaps(right_network)
}

#[wasm_bindgen]
pub fn get_cidr_details(cidr: &str) -> JsValue {
    let parts: Vec<&str> = cidr.split('/').collect();
    let cidr_address = parts[0];
    let cidr_bits = parts[1].parse::<u8>().unwrap();

    let ip = Ip::new(cidr_address, cidr_bits);

    let ip_range = IpRange { 
        subnet_mask: ip.get_subnet_mask(),
        wildcard_mask: ip.get_wildcard_mask(),
        broadcast_address: ip.get_broadcast_address(),
        network_address: ip.get_network_portion(),
        first_ip: ip.get_first_ip_address(), 
        last_ip: ip.get_last_ip_address(),
        assignable_hosts: ip.get_assignable_hosts().to_string()
    };

    JsValue::from_serde(&ip_range).unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cidr_networks_without_overlap() {
        let left_cidr = "10.0.0.0/16";
        let right_cidr = "172.31.0.0/24";

        let compare = compare_cidr_networks(left_cidr, right_cidr);

        assert_eq!(compare, false);
    }

    #[test]
    fn cidr_networks_with_overlap() {
        let left_cidr = "192.168.1.0/24";
        let right_cidr = "192.168.1.100/32";

        let compare = compare_cidr_networks(left_cidr, right_cidr);

        assert_eq!(compare, true);
    }

    #[test]
    fn cidr_details() {
        let cidr = "10.3.58.0/24";

        let parts: Vec<&str> = cidr.split('/').collect();
        let cidr_address = parts[0];
        let cidr_bits = parts[1].parse::<u8>().unwrap();

        let ip = Ip::new(cidr_address, cidr_bits);

        assert_eq!(ip.get_subnet_mask(), "255.255.255.0");
        assert_eq!(ip.get_wildcard_mask(), "0.0.0.255");
        assert_eq!(ip.get_broadcast_address(), "10.3.58.255");
        assert_eq!(ip.get_network_portion(), "10.3.58.0");
        assert_eq!(ip.get_first_ip_address(), "10.3.58.1");
        assert_eq!(ip.get_last_ip_address(), "10.3.58.254");
        assert_eq!(ip.get_assignable_hosts(), 254);
    }
}

#[derive(Debug)]
struct Ip {
    ip: String,
    subnet_bits: u8,
    subnet_mask: u32,
}

impl Ip {
    // Create a new IP instance with the given IP and subnet bits
    fn new(ip: &str, subnet_bits: u8) -> Self {
        let subnet_mask = 0xFFFFFFFF << (32 - subnet_bits);

        Self {
            ip: String::from(ip),
            subnet_bits,
            subnet_mask,
        }
    }

    // Calculate and return the subnet mask
    fn get_subnet_mask(&self) -> String {
        self.subnet_calculation()
    }

    fn subnet_calculation(&self) -> String {
        let mut mask_quads = Vec::new();
        for shift in [24, 16, 8, 0].iter() {
            let shifted_mask = self.subnet_mask >> *shift;
            mask_quads.push(format!("{}", shifted_mask & 255));
        }
        mask_quads.join(".")
    }

    // Calculate and format the wildcard mask
    fn get_wildcard_mask(&self) -> String {
        self.wildcard_calculation()
    }

    fn wildcard_calculation(&self) -> String {
        let mut mask_quads = Vec::new();
        for shift in [24, 16, 8, 0].iter() {
            let shifted_mask = self.subnet_mask >> *shift;
            mask_quads.push(format!("{}", 255 - (shifted_mask & 255)));
        }
        mask_quads.join(".")
    }

    // Calculate and return the network portion
    fn get_network_portion(&self) -> String {
        self.network_calculation()
    }

    fn network_calculation(&self) -> String {
        let splits = self.get_ip_address_quads();
        let mut network_quads = Vec::new();

        for (i, quad) in splits.into_iter().enumerate() {
            let subnet_mask_shifted = self.subnet_mask >> (24 - i * 8);
            let masked_quad = quad & subnet_mask_shifted;
            let formatted_quad = format!("{}", masked_quad);
            network_quads.push(formatted_quad);
        }

        network_quads.join(".")
    }

    // Calculate and return the broadcast address
    fn get_broadcast_address(&self) -> String {
        let network_quads = self.get_network_portion_quads();
        let mut broadcast_quads = Vec::new();

        for (i, quad) in network_quads.iter().enumerate() {
            let shifted_mask = !(self.subnet_mask >> (24 - i * 8)) & 0xFF;
            let broadcast_quad = (*quad as u32 | shifted_mask) as u8;
            broadcast_quads.push(format!("{}", broadcast_quad));
        }

        broadcast_quads.join(".")
    }

    // Calculate and return the first IP address
    fn get_first_ip_address(&self) -> String {
        let splits = self.get_ip_address_quads();
        let mut network_quads = Vec::new();

        for (i, quad) in splits.into_iter().enumerate() {
            let subnet_mask_shifted = self.subnet_mask >> (24 - i * 8);
            let masked_quad = quad & subnet_mask_shifted;
            if i == 3 {
                network_quads.push(format!("{}", masked_quad + 1));
            } else {
                network_quads.push(format!("{}", masked_quad));
            }
        }

        network_quads.join(".")
    }

    // Calculate and return the last IP address
    fn get_last_ip_address(&self) -> String {
        let network_quads = self.get_network_portion_quads();
        let number_ip_addresses = self.get_number_ip_addresses() - 1;
        let mut network_range_quads = Vec::new();

        for (i, quad) in network_quads.into_iter().enumerate() {
            let subnet_mask_shifted = self.subnet_mask >> (24 - i * 8);
            let masked_quad = quad & subnet_mask_shifted;
            let offset = (number_ip_addresses >> (24 - i * 8)) & 0xFF;
            network_range_quads.push(format!("{}", masked_quad + offset));

            // if i == 3 {
            //     network_range_quads.push(format!("{}", masked_quad + offset - 1));
            // } else {
            //     network_range_quads.push(format!("{}", masked_quad + offset));
            // }
        }

        network_range_quads.join(".")
    }

    // Get the number of available IP addresses
    fn get_assignable_hosts(&self) -> u32 {
        let hosts = (1u64 << (32 - self.subnet_bits)) - 2;
        hosts as u32
    }

    // Get the IP address as a vector of quadrants
    fn get_ip_address_quads(&self) -> Vec<u32> {
        self.ip
            .split(".")
            .map(|x| x.parse::<u32>().unwrap())
            .collect()
    }

    fn get_number_ip_addresses(&self) -> u32 {
        let subnet_bits = self.subnet_bits as u32;
        return (2 << (31 - subnet_bits)) - 1;
    }

    fn get_network_portion_quads(&self) -> Vec<u32> {
        self.network_calculation()
            .split('.')
            .map(|quad| quad.parse::<u32>().unwrap())
            .collect()
    }
}
