import * as React from 'react';
import {
  Affix,
  Button,
  Col,
  Container,
  Content,
  CustomProvider,
  Divider,
  Drawer,
  Footer,
  Grid,
  Header,
  Input,
  InputGroup,
  Loader,
  Nav,
  Navbar,
  Row,
  Table,
  Panel,
  Tag,
  TagGroup,
  Notification,
  toaster,
  Whisper,
  Tooltip
} from 'rsuite';
import ResponsiveNav from '@rsuite/responsive-nav';
import IconButton from 'rsuite/IconButton';
import { BsSunrise, BsSunsetFill, BsCalculator, BsCalculatorFill, BsDownload, BsFillStopCircleFill } from 'react-icons/bs';
import { FiFilter } from 'react-icons/fi';
import { BiReset } from 'react-icons/bi';
import { AiOutlineCloudServer } from 'react-icons/ai';
import {
  GiLongAntennaeBug as GiLongAntennaeBugIcon
} from 'react-icons/gi';

import axios from "axios";

import './custom-theme.less'
import './App.css';
import { getObjects } from './utils'

interface DataCenter {
  data_center: string;
  city?: string;
  state?: string;
  country: string;
  cidr_blocks?: string[];
  conflict?: boolean;
  cidr_networks?: string[]
}

interface CidrNetwork {
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

function _copyAndSort<T>(items: T[], columnKey: string, isSortedDescending?: boolean): T[] {
  const key = columnKey as keyof T;
  return items.slice(0).sort((a: T, b: T) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1));
}

let cidrFormat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[12][0-9]|3[0-2])$/;

const ErrorMessage = ({ children }: { children: any }) => <span style={{ color: 'red' }}>{children}</span>;

type PlacementType = 'topStart' | 'topCenter' | 'topEnd' | 'bottomStart' | 'bottomCenter' | 'bottomEnd';

export const App: React.FunctionComponent = () => {

  const [sortColumn, setSortColumn] = React.useState();
  const [sortType, setSortType] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const [isLight, setLight] = React.useState<boolean>(true);

  const [cidrValue, setcidrValue] = React.useState('');
  const [cidrDisabled, setCidrDisabled] = React.useState(false);

  const [filterValue, setFilterValue] = React.useState<string | undefined>('');
  const [items, setItemsValue] = React.useState<DataCenter[]>([]);
  const [_allItems, setAllItemsValue] = React.useState<DataCenter[]>([]);

  const [requestedCidrNetwork, setRequestedCidrNetwork] = React.useState<(CidrNetwork | null)>();
  const [panelContent, setPanelContent] = React.useState<(CidrNetwork | null)[]>();
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [isDocOpen, setIsDocOpen] = React.useState(false);
  const [elementDisabled, setElementDisabled] = React.useState(false);
  const [isSortedDescending] = React.useState(true);
  const [cidrMessage, setCidrMessage] = React.useState(false);
  const [active, setActive] = React.useState<(string | number | undefined)>('cidr1');
  const [activeDoc, setDocActive] = React.useState<(string | number | undefined)>(undefined);
  const [activeKey, setActiveKey] = React.useState<(string | number | undefined)>('PN');
  const [placement, setPlacement] = React.useState<PlacementType | undefined>('topCenter');

  const [sourceName, setSourceName] = React.useState('');
  const [sourceVersion, setSourceVersion] = React.useState('');
  const [sourceLastUpdated, setSourceLastUpdated] = React.useState('');
  const [sourceReleaseNotes, setSourceReleaseNotes] = React.useState('');
  const [sourceUrl, setSourceUrl] = React.useState('');
  const [issuesUrl, setIssuesUrl] = React.useState('');

  const data = items.filter((v: any, i: any) => i < 250);

  const topLevelTabs = [
    { eventKey: 'PN', label: 'Private Network' },
    { eventKey: 'SN', label: 'Service Network' },
    { eventKey: 'SV', label: 'SSL VPN' },
  ];

  const openPanel = React.useCallback((cidrDetails: any) => {
    const message = (
      <Notification type={'info'} header={'Run calculator'} closable>
        Please run the calculator with a valid CIDR value before you can see results.
      </Notification>
    )

    if (cidrDetails) {
      setIsPanelOpen(true);
      setPanelContent(cidrDetails);
    } else {
      toaster.push(message, { placement })
    }
  }, [placement]);

  const openDocPanel = React.useCallback((doc: string) => {
    setIsDocOpen(true);
    setDocActive(doc);
  }, []);

  const CompactCell = (props: any) => (
    <Table.Cell
      {...props}
      style={{ padding: 4 }}
    />
  );

  const CidrCell = (props: any) => {
    const { rowData, dataKey } = props;
    const pns = rowData['private_networks'];
    const serviceNetwork = rowData['service_network'];
    const sslVpn = rowData['ssl_vpn'];
    const cellKey = rowData[dataKey];

    return (
      <Table.Cell key={`${cellKey}`} {...props} style={{ padding: 4 }}>
        <Panel bordered style={{ padding: "5px" }}>
          <ResponsiveNav
            activeKey={activeKey} onSelect={setActiveKey} appearance="subtle" style={{ marginBottom: "10px" }}
          >
            {topLevelTabs.map(item => (
              <ResponsiveNav.Item key={item.eventKey} eventKey={item.eventKey}>
                {item.label}
              </ResponsiveNav.Item>
            ))}
          </ResponsiveNav>
          {
            activeKey === 'PN' &&
            <TagGroup style={{ marginBottom: "10px" }}>
              {
                pns.map((pn: any, index: any) => {
                  const pnKey = pn.key;
                  return (
                    <React.Fragment key={`${cellKey}-${pnKey}-${index}`}>
                      {
                        pn.cidr_blocks.map((cidr: any, index: any) => {
                          let conflict = false;
                          let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                          let obj = js && getObjects(js, 'cidr_notation', cidr);
                          conflict = obj && obj[0].conflict;

                          return (
                            <React.Fragment key={`${cellKey}-${pnKey}-${index}-a`}>
                              <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["cidr_networks"])}>{pnKey}: {cidr}</Tag>
                            </React.Fragment>
                          )
                        })
                      }
                      {pn.cidr_blocks.length === 0 && <Tag color={undefined}> No data found </Tag>}
                    </React.Fragment >
                  )
                })
              }
            </TagGroup>
          }

          {
            activeKey === 'SN' &&
            <TagGroup style={{ marginBottom: "10px" }}>
              {
                serviceNetwork.map((service: any, index: any) => {
                  return (
                    <React.Fragment key={`${cellKey}-service-${index}`}>
                      {
                        service.cidr_blocks.map((cidr: any, index: any) => {
                          let conflict = false;
                          let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                          let obj = js && getObjects(js, 'cidr_notation', cidr);
                          conflict = obj && obj[0].conflict;

                          return (
                            <React.Fragment key={`${cellKey}-service-${index}-c`}>
                              <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["cidr_networks"])}>{cidr}</Tag>
                            </React.Fragment >
                          )
                        })
                      }
                      {service.cidr_blocks.length === 0 && <Tag color={undefined}> No data found </Tag>}
                    </React.Fragment>
                  )
                })
              }
            </TagGroup>
          }

          {
            activeKey === 'SV' &&
            <TagGroup style={{ marginBottom: "10px" }}>
              {
                sslVpn.map((ssl: any, index: any) => {
                  return (
                    <React.Fragment key={`${cellKey}-ssl-vpn-${index}`}>
                      {
                        ssl.cidr_blocks.map((cidr: any, index: any) => {
                          let conflict = false;
                          let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                          let obj = js && getObjects(js, 'cidr_notation', cidr);
                          conflict = obj && obj[0].conflict;

                          return (
                            <React.Fragment key={`${cellKey}-ssl-vpn-${index}-c`}>
                              <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["cidr_networks"])}>{cidr}</Tag>
                            </React.Fragment >
                          )
                        })
                      }
                      {ssl.cidr_blocks.length === 0 && <Tag color={undefined}> No data found </Tag>}
                    </React.Fragment>
                  )
                })
              }
            </TagGroup>
          }
        </Panel>
      </Table.Cell>
    );
  };

  const DataCenterCell = (props: any) => {
    const { rowData, dataKey } = props;
    return (
      <Table.Cell {...props}>
        {rowData[dataKey] ?
          <React.Fragment>
            <Tag color={'red'}><AiOutlineCloudServer />  {rowData['data_center']}</Tag>
          </React.Fragment>
          :
          <React.Fragment>
            <Tag color={undefined}><AiOutlineCloudServer />  {rowData['data_center']}</Tag>
          </React.Fragment>
        }
      </Table.Cell>
    );
  };

  React.useEffect(() => {
    setElementDisabled(true);

    axios.post(`/api/subnetcalc`, {
      cidr: '0.0.0.0/0'
    }, {
      headers: {
        'content-type': 'application/json',
      }
    })
      .then((response) => {
        const sortedItems: DataCenter[] = _copyAndSort(response.data.data_centers, "data_center", !isSortedDescending);
        setSourceName(response.data.name);
        setSourceVersion(response.data.version);
        setSourceLastUpdated(response.data.last_updated);
        setSourceReleaseNotes(response.data.release_notes);
        setSourceUrl(response.data.source);
        setIssuesUrl(response.data.issues);
        setItemsValue(sortedItems);
        setAllItemsValue(sortedItems);
        setElementDisabled(false);
      });
  }, [isSortedDescending]);

  const _calculateClicked = () => {
    if (cidrValue.match(cidrFormat)) {
      setItemsValue([]);
      setCidrMessage(false);
      setElementDisabled(true);
      setCidrDisabled(true);
      axios.post(`/api/subnetcalc`, {
        cidr: cidrValue,
        filter: filterValue
      }, {
        headers: {
          'content-type': 'application/json',
        }
      })
        .then((response) => {
          const sortedItems: DataCenter[] = _copyAndSort(response.data.data_centers, "data_center", !isSortedDescending);
          setItemsValue(sortedItems);
          setAllItemsValue(sortedItems);
          setRequestedCidrNetwork(response.data.requested_cidr_networks);
          setElementDisabled(false);
        })
    } else {
      setCidrMessage(true);
    }
  }

  const _reset = () => {
    setcidrValue('');
    axios.post(`/api/subnetcalc`, {
      cidr: '0.0.0.0/0'
    }, {
      headers: {
        'content-type': 'application/json',
      }
    })
      .then((response) => {
        const sortedItems: DataCenter[] = _copyAndSort(response.data.data_centers, "data_center", !isSortedDescending);
        setSourceName(response.data.name);
        setSourceVersion(response.data.version);
        setSourceLastUpdated(response.data.last_updated);
        setSourceReleaseNotes(response.data.release_notes);
        setSourceUrl(response.data.source);
        setIssuesUrl(response.data.issues);
        setItemsValue(sortedItems);
        setAllItemsValue(sortedItems);
        setCidrDisabled(false);
      });
  }

  React.useEffect(() => {
    if (filterValue) {
      setItemsValue(_allItems?.filter(i => i.country.toLowerCase().indexOf(filterValue) > -1))
    }
  }, [_allItems, filterValue]);

  const getData = () => {
    if (sortColumn && sortType) {
      return data.sort((a: any, b: any) => {
        let x = a[sortColumn];
        let y = b[sortColumn];
        if (typeof x === 'string') {
          x = x.charCodeAt(0);
        }
        if (typeof y === 'string') {
          y = y.charCodeAt(0);
        }
        if (sortType === 'asc') {
          return x - y;
        } else {
          return y - x;
        }
      });
    }
    return data;
  };

  const onSetTheme = () => {
    setLight(!isLight)
  }

  const handleSortColumn = (sortColumn: any, sortType: any) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const styles = {
    width: 175,
    marginBottom: 10
  };

  const onChangeCidrValue = React.useCallback(
    (value: string, event: any) => {
      if (cidrMessage !== false) {
        setCidrMessage(false);
      }
      setcidrValue(value || '');
    },
    [cidrMessage],
  );

  const onFilterByCountry = React.useCallback(
    (value: string, event: any) => {
      value ? setItemsValue(_allItems?.filter(i => i.country.toLowerCase().indexOf(value) > -1)) : setItemsValue(_allItems);
      setFilterValue(value)
    },
    [_allItems],
  );

  const onDownloadJSON = () => {
    const json = JSON.stringify(items);
    const url = window.URL.createObjectURL(new Blob([json]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ibmcloud.json');
    document.body.appendChild(link);
    link.click();
  }


  return (
    <CustomProvider theme={isLight ? "light" : "dark"}>
      <Affix>
        <Header>
          <Navbar appearance="inverse">
            <Navbar.Brand >
              CIDR Conflict Calculator for IBM Cloud - Classic Infrastructure (Unofficial)
            </Navbar.Brand>
            <Nav pullRight>
              <Nav.Item icon={<IconButton aria-label='change theme' icon={isLight ? <BsSunsetFill /> : <BsSunrise />} onClick={onSetTheme} />} />
              <Nav.Item
                href={issuesUrl}
                target="_blank"
                rel="noopener noreferrer"
                icon={<IconButton aria-label='report a bug' icon={<GiLongAntennaeBugIcon />} />}
              />
            </Nav>
          </Navbar>
        </Header>
      </Affix>

      <Container style={{ paddingLeft: "15px", paddingRight: "15px", paddingTop: "20px" }}>
        <Content>
          <Grid fluid>
            <Col sm={7} md={5} lg={3}>
              <Affix top={70}>
                <Panel bordered style={{ padding: "5px" }}>
                  <Row>
                    <Col xs={24} sm={24} md={24}>
                      <InputGroup style={styles}>
                        <Input
                          value={cidrValue}
                          onChange={onChangeCidrValue}
                          placeholder="10.10.10.0/24"
                          disabled={cidrDisabled}
                        />
                        {!cidrDisabled &&
                          <Whisper placement="top" controlId="control-id-hover" trigger="hover"
                            speaker={
                              <Tooltip>
                                Run calculator.
                              </Tooltip>
                            }>
                            <InputGroup.Button aria-label='run calculator' onClick={_calculateClicked}>
                              {elementDisabled ? <BsCalculator /> : <BsCalculatorFill />}
                            </InputGroup.Button>
                          </Whisper>

                        }
                        {cidrDisabled &&
                          <Whisper placement="top" controlId="control-id-hover" trigger="hover"
                            speaker={
                              <Tooltip>
                                Reset.
                              </Tooltip>
                            }>
                            <InputGroup.Button aria-label='reset' onClick={_reset}>
                              {elementDisabled ? <BiReset /> : <BiReset />}
                            </InputGroup.Button>
                          </Whisper>
                        }
                      </InputGroup>
                      {cidrMessage ?
                        <ErrorMessage>
                          {'Invalid CIDR!'}
                          <Button target="_blank" href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing" appearance="link" style={{ textDecoration: "none" }}>
                            Learn more
                          </Button>
                        </ErrorMessage>
                        : null
                      }
                    </Col>

                    <Col xs={24} sm={24} md={24}>
                      <InputGroup style={styles}>
                        <Input
                          value={filterValue}
                          onChange={onFilterByCountry}
                          placeholder="country code"
                        />
                        <InputGroup.Addon>
                          <FiFilter />
                        </InputGroup.Addon>
                      </InputGroup>
                    </Col>
                  </Row>
                </Panel>
                <hr />
                <span>
                  <p>Use this tool to help to identify potential conflicts between IP ranges in your on-premises environment(s) and IP ranges used in IBM Cloud.</p>
                </span>
              </Affix>
            </Col>

            <Col sm={17} md={19} lg={18}>
              <Panel bordered style={{ padding: "5px" }}>
                <Table
                  virtualized
                  autoHeight
                  affixHeader={50}
                  height={420}
                  data={getData()}
                  sortColumn={sortColumn}
                  sortType={sortType}
                  onSortColumn={handleSortColumn}
                  loading={loading}
                  rowKey={'key'}
                  renderEmpty={filterValue === '' ? () => <Loader backdrop content="loading..." vertical /> : undefined}
                  showHeader={items.length !== 0 ? true : false}
                  wordWrap
                  rowHeight={200}
                >
                  <Table.Column width={125} sortable flexGrow={1}>
                    <Table.HeaderCell>Data Center</Table.HeaderCell>
                    <DataCenterCell dataKey="conflict" style={{ padding: 4 }} />
                  </Table.Column>

                  <Table.Column width={125} sortable flexGrow={1}>
                    <Table.HeaderCell>City</Table.HeaderCell>
                    <CompactCell dataKey="city" />
                  </Table.Column>

                  <Table.Column width={125} sortable flexGrow={1}>
                    <Table.HeaderCell>Country Code</Table.HeaderCell>
                    <CompactCell dataKey="country" />
                  </Table.Column>

                  <Table.Column width={750} flexGrow={4}>
                    <Table.HeaderCell>CIDR</Table.HeaderCell>
                    <CidrCell dataKey="data_center" />
                  </Table.Column>

                </Table>
              </Panel>
            </Col>

            <Col sm={24} md={24} lg={3}>
              <Affix top={70}>
                <span style={{ fontSize: '12px'}}>
                  <p><strong>{sourceName}</strong></p>
                  <p>
                    Version {sourceVersion}
                    <br />
                    Last updated on {sourceLastUpdated}
                    <br />
                    <a target="_blank" rel="noreferrer" href={sourceReleaseNotes}>Change History</a>
                    <br />
                    <a target="_blank" rel="noreferrer" href={sourceUrl}>Source Data</a>
                    <br />
                    <IconButton placement='right' color="blue" size="xs" appearance="ghost" onClick={onDownloadJSON} icon={<BsDownload />}> Download</IconButton>
                  </p>
                  <hr />

                  {activeKey === 'PN' &&
                    <React.Fragment>
                      <p style={{ marginTop: '20px' }}><strong>Private Network</strong></p>
                      <p>
                        Private Network includes the IP ranges used by compute resources deployed in the selected data center.
                        <Button style={{ fontSize: '12px'}} appearance='subtle' onClick={() => openDocPanel('private_network')}>
                          more...
                        </Button>
                      </p>
                    </React.Fragment>
                  }

                  {activeKey === 'SN' &&
                    <React.Fragment>
                      <p style={{ marginTop: '20px' }}><strong>Service Network</strong></p>
                      <p>
                        Service Network includes the IP ranges used by services running or accessible from the selected data center.
                        <Button style={{ fontSize: '12px'}} appearance='subtle' onClick={() => openDocPanel('service_network')}>
                          more...
                        </Button>
                      </p>
                    </React.Fragment>
                  }

                  {activeKey === 'SV' &&
                    <React.Fragment>
                      <p style={{ marginTop: '20px' }}><strong>SSL VPN</strong></p>
                      <p>
                        SSL VPN includes the IP ranges used when connecting via a VPN client to the selected data center.
                        <Button style={{ fontSize: '12px'}} appearance='subtle' onClick={() => openDocPanel('ssl_vpn')}>
                          more...
                        </Button>
                      </p>
                    </React.Fragment>
                  }
                  <hr />
                  <div style={{ marginTop: "20px" }}>
                    <p style={{ marginBottom: "10px" }}><strong>Documentation topics and tutorials</strong></p>
                    <p>
                      <a href="https://cloud.ibm.com/docs/solution-tutorials?topic=solution-tutorials-byoip" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                        <strong>Bring Your Own IP Address</strong>
                      </a>
                    </p>
                    <p>
                      This tutorial presents a brief overview of BYOIP implementation patterns that can be used with IBM Cloud
                      and a decision tree for identifying the appropriate pattern
                    </p>
                    <hr />
                  </div>
                </span>

              </Affix>
            </Col>
          </Grid>
        </Content>
      </Container>

      <Footer></Footer>

      <Drawer size={'sm'} placement={'right'} open={isDocOpen} onClose={() => setIsDocOpen(false)} >
        <Drawer.Header>
          <Drawer.Title>
            {activeDoc === 'private_network' && <span>Private Network</span>}
            {activeDoc === 'service_network' && <span>Service Network</span>}
            {activeDoc === 'ssl_vpn' && <span>SSL VPN</span>}
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          {activeDoc === 'private_network' &&
            <span>
              Private Network details....
            </span>
          }
          {activeDoc === 'service_network' &&
            <span>
              Be sure to configure <mark>rules and verify</mark> routes for DAL10, WDC04, and the location of your server.
              If your server is in an EU location, you must add rules allowing traffic from DAL10, WDC04, and AMS01 to your server.
              The traffic must be able to travel between the service networks and your server.
              By default, all servers and gateway/firewall devices are configured with a static route for the 10.0.0.0/8 network to the Back-end Customer Router (BCR).
              If you change that configuration such that the entire 10.0.0.0/8 network is pointed elsewhere,
              you must also configure static routes for the service networks to ensure they are pointed to the BCR.
              Failing to do so will result in the static routes being pointed to whichever IP address you replaced the original with. If you do not change the default static route for 10.0.0.0/8,
              then the service networks are already routed correctly.
            </span>
          }
          {activeDoc === 'ssl_vpn' &&
            <span>
              SSL VPN details...
            </span>
          }
        </Drawer.Body>
      </Drawer>

      <Drawer size={'sm'} placement={'right'} open={isPanelOpen} onClose={() => setIsPanelOpen(false)} onEnter={() => setActive('cidr1')}>
        <Drawer.Header>
          <Drawer.Title>Conflict Dashboard</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <div key={'cidr0'}>
            <Grid fluid style={{ marginBottom: "10px" }}>
              <Row>
                <Col xs={24} sm={12} md={8}>
                  <label>CIDR Notation:</label>
                  <Input disabled value={requestedCidrNetwork?.cidr_notation} />
                  <label>Wildcard Mask:</label>
                  <Input disabled value={requestedCidrNetwork?.wildcard_mask} />
                  <label>First Assignable Host:</label>
                  <Input disabled value={requestedCidrNetwork?.first_assignable_host} />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <label>Subnet Mask:</label>
                  <Input disabled value={requestedCidrNetwork?.subnet_mask} />
                  <label>Broadcast Address:</label>
                  <Input disabled value={requestedCidrNetwork?.broadcast_address} />
                  <label>Last Assignable Host:</label>
                  <Input disabled value={requestedCidrNetwork?.last_assignable_host} />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <label>Subnet Bits:</label>
                  <Input disabled value={requestedCidrNetwork?.subnet_bits} />
                  <label>Network Address:</label>
                  <Input disabled value={requestedCidrNetwork?.network_address} />
                  <label># Assignable Hosts:</label>
                  <Input disabled value={requestedCidrNetwork?.assignable_hosts} />
                </Col>
              </Row>
            </Grid>
          </div>

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
                    <label>Conflict:</label>
                    <Input disabled value={String(cidrNetwork?.conflict)} />
                    <label>CIDR Notation:</label>
                    <Input disabled value={cidrNetwork?.cidr_notation} />
                    <label>Subnet Mask:</label>
                    <Input disabled value={cidrNetwork?.subnet_mask} />
                    <label>Subnet Bits:</label>
                    <Input disabled value={cidrNetwork?.subnet_bits} />
                    <label>Wildcard Mask:</label>
                    <Input disabled value={cidrNetwork?.wildcard_mask} />
                    <label>Broadcast Address:</label>
                    <Input disabled value={cidrNetwork?.broadcast_address} />
                    <label>Network Address:</label>
                    <Input disabled value={cidrNetwork?.network_address} />
                    <label>First Assignable Host:</label>
                    <Input disabled value={cidrNetwork?.first_assignable_host} />
                    <label>Last Assignable Host:</label>
                    <Input disabled value={cidrNetwork?.last_assignable_host} />
                    <label># Assignable Hosts:</label>
                    <Input disabled value={cidrNetwork?.assignable_hosts} />
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
