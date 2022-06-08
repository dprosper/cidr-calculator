
export interface DataCenter {
  data_center: string;
  city?: string;
  state?: string;
  country: string;
  cidr_blocks?: string[];
  conflict?: boolean;
  cidr_networks?: string[]
}

export interface CidrNetwork {
  conflict: boolean;
  cidr_notation: string;
  subnet_bits: string;
  subnet_mask: string;
  wildcard_mask: string;
  network_address: string;
  broadcast_address: string;
  assignable_hosts: string;
  first_assignable_host: string;
  last_assignable_host: string;
}

export function _copyAndSort<T>(items: T[], columnKey: string, isSortedDescending?: boolean): T[] {
  const key = columnKey as keyof T;
  return items.slice(0).sort((a: T, b: T) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1));
}
