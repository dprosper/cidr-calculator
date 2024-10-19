
export interface DataCenter {
  name: string;
  city?: string;
  state?: string;
  country: string;
  cidr_blocks?: string[];
  private_networks?: string[];
  conflict?: boolean;
  cidr_networks?: CidrNetwork[]
}

export interface CidrNetwork {
  conflict: boolean;
  service: string;
  cidr_notation: string;
  subnet_bits: number;
  subnet_mask: string;
  wildcard_mask: string;
  network_address: string;
  broadcast_address: string;
  assignable_hosts: number;
  first_assignable_host: string;
  last_assignable_host: string;
}

export function _copyAndSort<T>(items: T[], columnKey: string, isSortedDescending?: boolean): T[] {
  const key = columnKey as keyof T;
  return items.slice(0).sort((a: T, b: T) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1));
}
