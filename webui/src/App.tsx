import * as React from 'react';
import {
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
  Message,
  Nav,
  Navbar,
  Row,
  Sidebar,
  Table,
} from 'rsuite';

import 'rsuite/dist/rsuite.min.css'
import IconButton from 'rsuite/IconButton';
import { BsSunrise, BsSunsetFill, BsCalculator, BsCalculatorFill, BsLayoutSidebarReverse } from 'react-icons/bs';
import { FiFilter } from 'react-icons/fi';

import axios from "axios";

import './App.css';

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

const CompactCell = (props: any) => (
  <Table.Cell
    {...props}
    style={{ padding: 4 }}
  />
);

const CidrCell = (props: any) => {
  const { rowData } = props;
  const cidrs = rowData['cidr_blocks'];
  const key = rowData['key'];
  return (
    <Table.Cell {...props} >
      {cidrs.map((cidr: any, index: any) => (
        <span key={`${key}-${index}`} style={{ display: "block" }}>{cidr}</span>
      )
      )}
    </Table.Cell>
  );
};

const StatusCell = (props: any) => {
  const { rowData, dataKey } = props;
  return (
    <Table.Cell {...props}>
      {rowData[dataKey] ?
        <Button target="_blank" href="https://cloud.ibm.com/docs/solution-tutorials?topic=solution-tutorials-byoip" appearance="link" style={{ textDecoration: "none" }}>
          Conflict found 😮
        </Button>
        :
        <Button target="_blank" href="https://cloud.ibm.com/docs" appearance="link" style={{ textDecoration: "none" }}>
          No conflict found 😎
        </Button>
      }
    </Table.Cell>
  );
};

let cidrFormat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[12][0-9]|3[0-2])$/;

const ErrorMessage = ({ children }: { children: any }) => <span style={{ color: 'red' }}>{children}</span>;

export const App: React.FunctionComponent = () => {

  const [sortColumn, setSortColumn] = React.useState();
  const [sortType, setSortType] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const [isLight, setLight] = React.useState<boolean>(true);

  const [cidrValue, setcidrValue] = React.useState('');

  const [filterValue, setFilterValue] = React.useState<string | undefined>('');
  const [items, setItemsValue] = React.useState<DataCenter[]>([]);
  const [_allItems, setAllItemsValue] = React.useState<DataCenter[]>([]);

  const [requestedCidrNetwork, setRequestedCidrNetwork] = React.useState<(CidrNetwork | null)>();
  const [panelContent, setPanelContent] = React.useState<(CidrNetwork | null)[]>();
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [elementDisabled, setElementDisabled] = React.useState(false);
  const [isSortedDescending] = React.useState(true);
  const [cidrMessage, setCidrMessage] = React.useState(false);
  const [active, setActive] = React.useState('cidr1');

  const data = items.filter((v: any, i: any) => i < 250);

  const openPanel = React.useCallback((cidrDetails: any) => {
    if (cidrDetails) {
      setIsPanelOpen(true);
      setPanelContent(cidrDetails);
    }
  }, []);

  const CidrCellPanelButton = (props: any) => {
    const { rowData, dataKey } = props;

    return (
      <Table.Cell {...props} align='center' style={{ padding: 'unset' }}>
        {rowData[dataKey] ? <IconButton appearance="subtle" onClick={() => openPanel(rowData[dataKey])} icon={<BsLayoutSidebarReverse />} /> : null}
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
    width: 300,
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

  return (
    <CustomProvider theme={isLight ? "light" : "dark"}>
      <Container>
        <Header>
          <Navbar appearance="inverse">
            <Navbar.Brand >
              CIDR Calculator for IBM Cloud (Unofficial)
            </Navbar.Brand>
            <Nav pullRight>
              <Nav.Item icon={<IconButton aria-label='change theme' icon={isLight ? <BsSunsetFill /> : <BsSunrise />} onClick={onSetTheme} />} />
            </Nav>
          </Navbar>
        </Header>

        <Container>
          <Sidebar></Sidebar>

          <Content>
            <Message type="info" style={{ padding: '10px', margin: '30px' }}>
              <p>Use this tool to help to identify potential conflicts with IP addresses ranges in your on-premises environment(s) and IP address ranges used in IBM Cloud.</p>
            </Message>
            <Grid fluid>
              <Row>
                <Col xs={24} sm={12} md={8}>

                  <InputGroup style={styles}>
                    <Input
                      value={cidrValue}
                      onChange={onChangeCidrValue}
                      placeholder="10.10.10.0/24"
                    />
                    <InputGroup.Button aria-label='calculate' onClick={_calculateClicked}>
                      {elementDisabled ? <BsCalculator /> : <BsCalculatorFill />}
                    </InputGroup.Button>
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
                <Col xs={24} sm={12} md={8}>

                  <InputGroup style={styles}>
                    <Input
                      value={filterValue}
                      onChange={onFilterByCountry}
                      placeholder="country"
                    />
                    <InputGroup.Addon>
                      <FiFilter />
                    </InputGroup.Addon>
                  </InputGroup>

                </Col>
              </Row>
            </Grid>
            <hr />

            <Table
              virtualized
              autoHeight
              // bordered
              // cellBordered
              affixHeader
              height={420}
              data={getData()}
              sortColumn={sortColumn}
              sortType={sortType}
              onSortColumn={handleSortColumn}
              loading={loading}
              rowKey={'key'}
              renderEmpty={() => <Loader backdrop content="loading..." vertical />}
              showHeader={items.length !== 0 ? true : false}
              wordWrap
            >
              <Table.Column width={150} fixed sortable>
                <Table.HeaderCell>Data Center</Table.HeaderCell>
                <CompactCell dataKey="data_center" style={{ padding: 4 }} />
              </Table.Column>

              <Table.Column width={150} fixed sortable>
                <Table.HeaderCell>City</Table.HeaderCell>
                <CompactCell dataKey="city" />
              </Table.Column>

              <Table.Column width={150} sortable>
                <Table.HeaderCell>Country</Table.HeaderCell>
                <CompactCell dataKey="country" />
              </Table.Column>

              <Table.Column width={150} resizable>
                <Table.HeaderCell>CIDR</Table.HeaderCell>
                <CidrCell dataKey="cidr_networks" />
              </Table.Column>

              <Table.Column width={50}>
                <Table.HeaderCell>.</Table.HeaderCell>
                <CidrCellPanelButton dataKey="cidr_networks" />
              </Table.Column>

              <Table.Column sortable flexGrow={200}>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <StatusCell dataKey="conflict" />
              </Table.Column>
            </Table>

            <Drawer size={'sm'} placement={'right'} open={isPanelOpen} onClose={() => setIsPanelOpen(false)} onEnter={() => setActive('cidr1')}>
              <Drawer.Header>
                <Drawer.Title>Conflict Dashboard</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                <Nav appearance="subtle" activeKey={active} onSelect={setActive} style={{ width: 100 }}>
                  <Nav.Item key={'tab-cidr0'} eventKey={'cidr0'}>{'CIDR 0'}</Nav.Item>

                  {panelContent && panelContent.map((cidrNetwork, index) => {
                    const selected = `cidr${index + 1}`;
                    const selectedText = `CIDR ${index + 1}`;

                    return (
                      <Nav.Item key={`tab-${selected}`} eventKey={selected}>{selectedText}</Nav.Item>
                    )
                  }
                  )}
                </Nav>
                <Divider style={{ marginTop: '0px', marginBottom: '24px' }} />
                {'cidr0' === active &&
                  <div key={'cidr0'}>
                    <label>CIDR Notation:</label>
                    <Input disabled value={requestedCidrNetwork?.cidr_notation} />
                    <label>Subnet Mask:</label>
                    <Input disabled value={requestedCidrNetwork?.subnet_mask} />
                    <label>Subnet Bits:</label>
                    <Input disabled value={requestedCidrNetwork?.subnet_bits} />
                    <label>Wildcard Mask:</label>
                    <Input disabled value={requestedCidrNetwork?.wildcard_mask} />
                    <label>Broadcast Address:</label>
                    <Input disabled value={requestedCidrNetwork?.broadcast_address} />
                    <label>Network Address:</label>
                    <Input disabled value={requestedCidrNetwork?.network_address} />
                    <label>First Assignable Host:</label>
                    <Input disabled value={requestedCidrNetwork?.first_assignable_host} />
                    <label>Last Assignable Host:</label>
                    <Input disabled value={requestedCidrNetwork?.last_assignable_host} />
                    <label># Assignable Hosts:</label>
                    <Input disabled value={requestedCidrNetwork?.assignable_hosts} />
                  </div>
                }

                {panelContent && panelContent.map((cidrNetwork, index) => {
                  const selected = `cidr${index + 1}`;

                  return (
                    <div key={selected}>
                      {selected === active &&
                        <div>
                          <label>Conflict found with CIDR 0:</label>
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
                        </div>
                      }
                    </div>
                  )
                }
                )}

              </Drawer.Body>

            </Drawer>
          </Content>
          <Sidebar></Sidebar>
        </Container>

        <Footer></Footer>
      </Container>
    </CustomProvider >
  );
};
