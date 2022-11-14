## Frequently Asked Questions

##### What level of support is provided for this tool?
  The CIDR Calculator tool is a community-based innovation.  It is supported on a best effort basis. You can ask questions or report a bug using the tool's [GitHub repository's Issues](https://github.com/dprosper/cidr-calculator/issues) tab.

##### Do you track access to the tool?
  We store usage and feedback information that is not traceable to any individual person or company in order to understand the value and improve on the tool.

##### Where is the source code for this tool?
  All the code for this application is located on [GitHub](https://github.com/dprosper/cidr-calculator).

##### Can I download the source data used in this tool?
  The source data used by the tool is available in JSON format and can be downloaded from the source code repository in [GitHub](https://github.com/dprosper/cidr-calculator/blob/main/data/datacenters.json). Once downloaded you can use a tool such as `jq` to query the data. For example:

  ```sh
    jq -r '.data_centers[] | select(.name=="ams03")' < datacenters.json 
  ```

  Note: The json file contains additional IP ranges that are not used by the tool, i.e. Front End Public IPs (`front_end_public_network`) and Load Balancer IPs (`load_balancers_ips`) are public space IP ranges and are not used by the tool to identify conflicts with your network.  