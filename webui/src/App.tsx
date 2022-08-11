import * as React from 'react';
import {
  Affix,
  Col,
  Container,
  Content,
  CustomProvider,
  Divider,
  Drawer,
  Footer,
  Grid,
  Input,
  Loader,
  Row,
  Table,
  Panel,
  Tag,
  Notification,
  useToaster,
  TagPicker,
} from 'rsuite';
import ResponsiveNav from '@rsuite/responsive-nav';
import IconButton from 'rsuite/IconButton';
import { BsDownload, BsFillStopCircleFill } from 'react-icons/bs';
import { AiOutlineCloudServer } from 'react-icons/ai';

import axios from "axios";

import { InputSection } from './components/InputSection';
import { DocPanel } from './components/DocPanel';
import { HeaderNav } from './components/Header';
import { TabView } from './components/TabView';

import './custom-theme.less'
import './App.css';
import { sortData } from './utils';

import { DataCenter, CidrNetwork, _copyAndSort } from './components/common';

interface IDSelectDataCenterProps {
  _allDataCenters: DataCenter[],
  setDataCenters: (value: DataCenter[]) => void,
  setSelectedDataCenters: (value: string[]) => void,
  elementDisabled: boolean
}

const SelectDataCenter = ({ _allDataCenters, setDataCenters, setSelectedDataCenters, elementDisabled }: IDSelectDataCenterProps) => {
  const handleOnChange = (value: string[]) => {
    if (value && value[0]) {
      setSelectedDataCenters(value)
      setDataCenters(_allDataCenters?.filter(i => value.includes(i.name.toLowerCase())));
    } else {
      setSelectedDataCenters([])
      setDataCenters(_allDataCenters);
    }
  };

  const compare = (a: string, b: string) => {
    let nameA = a.toUpperCase();
    let nameB = b.toUpperCase();

    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  }

  return (
    <React.Fragment>
      <TagPicker
        placeholder="Select data center(s) to display and export"
        data={_allDataCenters}
        searchable
        disabled={elementDisabled}
        block
        groupBy="geo_region"
        sort={isGroup => {
          if (isGroup) {
            return (a, b) => {
              return compare(a.groupTitle, b.groupTitle);
            };
          }

          return (a, b) => {
            return compare(a.name, b.name);
          };
        }}
        labelKey="key"
        valueKey="name"
        onChange={(value) => handleOnChange(value)}
        renderMenuGroup={(label, item) => {
          return (
            <div>
              <p> {label} - ({item.children?.length}) </p>
            </div>
          );
        }}
        renderMenuItem={(label, item) => {
          return (
            <div>
              {label} - ({item.city})
            </div>
          );
        }}
      />
    </React.Fragment>
  );
}

const message = (
  <Notification type={'info'} header={'Run calculator'} closable>
    Please run the calculator with a valid CIDR value before you can see any conflict results.
  </Notification>
)

export const App = () => {
  const [sortColumn, setSortColumn] = React.useState();
  const [sortType, setSortType] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const [isLight, setLight] = React.useState<boolean>(true);

  const [dataCenters, setDataCenters] = React.useState<DataCenter[]>([]);
  const [_allDataCenters, setAllDataCenters] = React.useState<DataCenter[]>([]);
  const [selectedDataCenters, setSelectedDataCenters] = React.useState<string[]>([]);

  const [requestedCidrNetwork, setRequestedCidrNetwork] = React.useState<(CidrNetwork | null)>();
  const [panelContent, setPanelContent] = React.useState<(CidrNetwork | null)[]>();
  const [panelDataCenter, setPanelDataCenter] = React.useState<(string | null)>();
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [elementDisabled, setElementDisabled] = React.useState(false);
  const [isSortedDescending] = React.useState(true);
  const [active, setActive] = React.useState<(string | number | undefined)>('cidr1');

  const [sourceName, setSourceName] = React.useState('');
  const [sourceLastUpdated, setSourceLastUpdated] = React.useState('');
  const [sourceUrl, setSourceUrl] = React.useState('');
  const [issuesUrl, setIssuesUrl] = React.useState('');
  const [clientIP, setClientIP] = React.useState('');
  const [location, setLocation] = React.useState('');

  const toaster = useToaster();

  const openPanel = React.useCallback((dataCenter: string, cidrDetails: any) => {
    if (cidrDetails) {
      setIsPanelOpen(true);
      setPanelContent(cidrDetails);
      setPanelDataCenter(dataCenter);
    } else {
      toaster.push(message, { placement: 'topCenter' })
    }
  }, [toaster]);

  const CompactCell = (props: any) => (
    <Table.Cell
      {...props}
      style={{ padding: 4 }}
    />
  );

  const DataCenterCell = React.useCallback((props: any) => {
    const { rowData, dataKey } = props;
    return (
      <Table.Cell {...props}>
        <React.Fragment>
          <Tag
            color={!requestedCidrNetwork || requestedCidrNetwork?.cidr_notation === '' ? undefined : rowData['conflict'] === false ? 'green' : 'red'}
            style={{ cursor: "pointer" }}
            onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>
            <AiOutlineCloudServer />  {rowData[dataKey]}
          </Tag>
        </React.Fragment>
      </Table.Cell>
    );
  }, [openPanel, requestedCidrNetwork]);


  React.useEffect(() => {
    setElementDisabled(true);

    const fetchData = async () => {
      const cf_response = await axios.get(`https://cloudflare.com/cdn-cgi/trace`);

      const trace = cf_response.data.split(/\r?\n/);
      let ip: string = "";
      let loc: string = "";
      trace.map((entry: string) => {
        if (entry && entry.substring(0, 2) === 'ip') {
          ip = entry.substring(3);
          setClientIP(ip);
        }
        if (entry && entry.substring(0, 3) === 'loc') {
          loc = entry.substring(4);
          setLocation(loc);
        }
        return null
      })

      const response = await axios.post(`/api/subnetcalc`, {
        cidr: '0.0.0.0/0'
      }, {
        headers: {
          'content-type': 'application/json',
          'X-Calculator-Client-Ip': ip,
          'X-Calculator-Client-Loc': loc
        }
      });

      const sortedDataCenters: DataCenter[] = _copyAndSort(response.data.data_centers, "name", !isSortedDescending);
      setSourceName(response.data.name);
      setSourceLastUpdated(response.data.last_updated);
      setSourceUrl(response.data.source);
      setIssuesUrl(response.data.issues);
      setDataCenters(sortedDataCenters);
      setAllDataCenters(sortedDataCenters);
      setElementDisabled(false);

    }

    fetchData()
      .catch(console.error);;

  }, [isSortedDescending]);

  const handleSortColumn = (sortColumn: any, sortType: any) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const onDownloadJSON = () => {
    if (dataCenters[0].cidr_networks) {
      const json = JSON.stringify(dataCenters);
      const url = window.URL.createObjectURL(new Blob([json]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ibmcloud-reserved-ip-ranges.json');
      document.body.appendChild(link);
      link.click();
    } else {
      toaster.push(message, { placement: 'topCenter' });
    }
  }

  const onDownloadCSV = () => {
    if (dataCenters[0].cidr_networks) {
      let csv = `Data Center,CIDR Notation,Used for,Conflict\n`;
      dataCenters.map((dc, index) => {
        return (
          dc.cidr_networks?.map((net, index) => (
            csv += `${dc.name},${net.cidr_notation},${net.service},${net.conflict}\n`
          ))
        )
      });

      const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ibmcloud-reserved-ip-ranges.csv');
      document.body.appendChild(link);
      link.click();
    } else {
      toaster.push(message, { placement: 'topCenter' });
    }
  }

  return (
    <CustomProvider
      theme={isLight ? "light" : "dark"}
    >
      <Affix>
        <HeaderNav setLight={setLight} isLight={isLight} issuesUrl={issuesUrl} />
      </Affix>

      <Container style={{ paddingLeft: "15px", paddingRight: "15px", paddingTop: "20px" }}>
        <Content>
          <Grid fluid>
            <Col sm={7} md={5} lg={3}>
              <Affix top={76}>
                <InputSection
                  isSortedDescending={isSortedDescending}
                  setRequestedCidrNetwork={setRequestedCidrNetwork}
                  requestedCidrNetwork={requestedCidrNetwork}
                  setItemsValue={setDataCenters}
                  setElementDisabled={setElementDisabled}
                  selectedDataCenters={selectedDataCenters}
                  clientIP={clientIP}
                  location={location}
                />
              </Affix>
            </Col>

            <Col sm={17} md={19} lg={18}>
              <Panel bordered style={{ padding: "5px" }}>
                <React.Fragment>
                  <Row>
                    <Col md={20}>
                      <SelectDataCenter setDataCenters={setDataCenters} _allDataCenters={_allDataCenters} setSelectedDataCenters={setSelectedDataCenters} elementDisabled={elementDisabled} />
                    </Col>
                    <Col md={4}>
                      <IconButton placement='right' color="blue" size="xs" appearance="subtle" onClick={onDownloadJSON} icon={<BsDownload />}> Export in JSON</IconButton>
                      <IconButton placement='right' color="blue" size="xs" appearance="subtle" onClick={onDownloadCSV} icon={<BsDownload />}> Export in CSV</IconButton>
                    </Col>
                  </Row>
                  <hr />

                  <React.Fragment>
                    <Table
                      virtualized
                      autoHeight
                      affixHeader={50}
                      height={420}
                      data={sortData(sortColumn, sortType, dataCenters)}
                      sortColumn={sortColumn}
                      sortType={sortType}
                      onSortColumn={handleSortColumn}
                      loading={loading}
                      rowKey={'key'}
                      renderEmpty={() => <Loader backdrop content="loading..." vertical />}
                      showHeader={dataCenters.length !== 0 ? true : false}
                      wordWrap
                      rowHeight={200}
                    >
                      <Table.Column
                        width={50}
                        sortable
                        flexGrow={1}
                      >
                        <Table.HeaderCell>Data Center</Table.HeaderCell>
                        <DataCenterCell dataKey="name" style={{ padding: 4 }} />
                      </Table.Column>

                      <Table.Column width={50}
                        sortable
                        flexGrow={1}
                      >
                        <Table.HeaderCell>City</Table.HeaderCell>
                        <CompactCell dataKey="city" />
                      </Table.Column>

                      <Table.Column width={50} sortable flexGrow={1}>
                        <Table.HeaderCell>Country Code</Table.HeaderCell>
                        <CompactCell dataKey="country" />
                      </Table.Column>

                      <Table.Column width={1000} flexGrow={5}>
                        <Table.HeaderCell>IBM Cloud IP ranges</Table.HeaderCell>
                        <TabView dataKey="name" openPanel={openPanel} />
                      </Table.Column>
                    </Table>
                  </React.Fragment>
                </React.Fragment>
              </Panel>
            </Col>

            <Col sm={24} md={24} lg={3}>
              <Affix top={76}>
                <span style={{ fontSize: '12px' }}>
                  <p><strong>{sourceName}</strong></p>
                  <p>
                    <a target="_blank" rel="noreferrer" href={sourceUrl}>Source Data</a>
                    <br />
                    Last updated on {sourceLastUpdated}
                    <br />
                  </p>

                  <hr />

                  <DocPanel clientIP={clientIP} location={location} />

                  <hr />
                  <div style={{ marginTop: "20px" }}>
                    <p style={{ marginBottom: "10px" }}><strong>IBM Cloud topics and tutorials</strong></p>
                    <p>
                      <a href="https://cloud.ibm.com/docs/solution-tutorials?topic=solution-tutorials-byoip" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                        <strong>Bring Your Own IP Address</strong>
                      </a>
                    </p>
                    <p>
                      This tutorial presents a brief overview of BYOIP implementation patterns that can be used with IBM Cloud Classic infrastructure
                      and a decision tree for identifying the appropriate pattern.
                    </p>
                    <hr />
                  </div>
                </span>

              </Affix>
            </Col>
          </Grid>
        </Content>
      </Container>

      <Footer style={{ textAlign: "center" }}>
        <p style={{ margin: "25px" }}>
          A project by <a target="_blank" rel="noreferrer" href="https://maisonprosper.com/">Dimitri Prosper</a>
        </p>
      </Footer>

      <Drawer size={'md'} placement={'right'} open={isPanelOpen} onClose={() => setIsPanelOpen(false)} onEnter={() => setActive('cidr1')}>
        <Drawer.Header>
          <Drawer.Title>Conflict Dashboard</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <h2>{panelDataCenter}</h2>
          <ResponsiveNav
            appearance="subtle"
            activeKey={active}
            onSelect={setActive}
            style={{ width: 100 }}
          >
            {panelContent && panelContent.map((cidrNetwork, index) => {
              const selected = `cidr${index + 1}`;
              const selectedText = cidrNetwork?.conflict ?
                <React.Fragment><BsFillStopCircleFill color='red' /> CIDR {index + 1}</React.Fragment>
                :
                <React.Fragment><BsFillStopCircleFill color='green' /> CIDR {index + 1}</React.Fragment>;

              return (
                <ResponsiveNav.Item key={`tab-${selected}`} eventKey={selected}>{selectedText}</ResponsiveNav.Item>
              )
            }
            )}
          </ResponsiveNav>

          <Divider style={{ marginTop: '0px', marginBottom: '24px' }} />

          {panelContent && panelContent.map((cidrNetwork, index) => {
            const selected = `cidr${index + 1}`;

            return (
              <div key={selected}>
                {selected === active &&
                  <React.Fragment>
                    <Grid fluid style={{ marginBottom: "10px" }}>
                      <Row>
                        <Col xs={24} sm={12} md={12}>
                          <label>Reserved IP range for:</label>
                          <Input disabled value={String(cidrNetwork?.service)} />
                        </Col>
                        <Col xs={24} sm={12} md={12}>
                          <label>Conflict:</label>
                          <Input disabled value={String(cidrNetwork?.conflict)} />
                        </Col>
                      </Row>
                      <Row>
                        <Col xs={24} sm={12} md={8}>
                          <label>CIDR Notation:</label>
                          <Input disabled value={cidrNetwork?.cidr_notation} />
                          <label>Wildcard Mask:</label>
                          <Input disabled value={cidrNetwork?.wildcard_mask} />
                          <label>First Assignable Host:</label>
                          <Input disabled value={cidrNetwork?.first_assignable_host} />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <label>Subnet Mask:</label>
                          <Input disabled value={cidrNetwork?.subnet_mask} />
                          <label>Broadcast Address:</label>
                          <Input disabled value={cidrNetwork?.broadcast_address} />
                          <label>Last Assignable Host:</label>
                          <Input disabled value={cidrNetwork?.last_assignable_host} />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <label>Network Address:</label>
                          <Input disabled value={cidrNetwork?.network_address} />
                          <label># Assignable Hosts:</label>
                          <Input disabled value={cidrNetwork?.assignable_hosts} />
                        </Col>
                      </Row>
                    </Grid>
                  </React.Fragment>
                }
              </div>
            )
          }
          )}
        </Drawer.Body>
      </Drawer>
    </CustomProvider >
  );
};
