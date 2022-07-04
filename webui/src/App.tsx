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
  TagGroup,
  Notification,
  toaster,
  InputGroup,
  Whisper,
  Tooltip,
} from 'rsuite';

import ResponsiveNav from '@rsuite/responsive-nav';
import IconButton from 'rsuite/IconButton';
import { BsDownload, BsFillStopCircleFill } from 'react-icons/bs';
import { AiOutlineCloudServer } from 'react-icons/ai';
import { MdFindReplace } from 'react-icons/md';

import axios from "axios";

import { InputSection } from './components/InputSection';
import { DocPanel } from './components/DocPanel';
import { HeaderNav } from './components/Header';

import './custom-theme.less'
import './App.css';
import { getObjects, sortData } from './utils';

import { DataCenter, CidrNetwork, _copyAndSort } from './components/common';

type PlacementType = 'topStart' | 'topCenter' | 'topEnd' | 'bottomStart' | 'bottomCenter' | 'bottomEnd';

export const App = () => {
  const [sortColumn, setSortColumn] = React.useState();
  const [sortType, setSortType] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const [isLight, setLight] = React.useState<boolean>(true);

  const [filterValue, setFilterValue] = React.useState<string | undefined>('');
  const [items, setItemsValue] = React.useState<DataCenter[]>([]);
  const [_allItems, setAllItemsValue] = React.useState<DataCenter[]>([]);

  const [requestedCidrNetwork, setRequestedCidrNetwork] = React.useState<(CidrNetwork | null)>();
  const [panelContent, setPanelContent] = React.useState<(CidrNetwork | null)[]>();
  const [panelDataCenter, setPanelDataCenter] = React.useState<(string | null)>();
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [elementDisabled, setElementDisabled] = React.useState(false);
  const [isSortedDescending] = React.useState(true);
  const [active, setActive] = React.useState<(string | number | undefined)>('cidr1');
  const [activeKey, setActiveKey] = React.useState<(string | number | undefined)>('PN');
  const [placement, setPlacement] = React.useState<PlacementType | undefined>('topCenter');

  const [sourceName, setSourceName] = React.useState('');
  const [sourceVersion, setSourceVersion] = React.useState('');
  const [sourceLastUpdated, setSourceLastUpdated] = React.useState('');
  const [sourceReleaseNotes, setSourceReleaseNotes] = React.useState('');
  const [sourceUrl, setSourceUrl] = React.useState('');
  const [issuesUrl, setIssuesUrl] = React.useState('');
  const [tableDisplay, setTableDisplay] = React.useState('tab');
  const [rowHeight, setRowHeight] = React.useState(200);

  const topLevelTabs = [
    { eventKey: 'PN', label: 'Private Network' },
    { eventKey: 'SN', label: 'Service Network' },
    { eventKey: 'SV', label: 'SSL VPN' },
    { eventKey: 'EV', label: 'eVault' },
    { eventKey: 'FB', label: 'File & Block' },
    { eventKey: 'AM', label: 'AdvMon (Nimsoft)' },
    { eventKey: 'IC', label: 'ICOS' },
  ];

  const openPanel = React.useCallback((dataCenter: string, cidrDetails: any) => {
    const message = (
      <Notification type={'info'} header={'Run calculator'} closable>
        Please run the calculator with a valid CIDR value before you can see results.
      </Notification>
    )

    if (cidrDetails) {
      setIsPanelOpen(true);
      setPanelContent(cidrDetails);
      setPanelDataCenter(dataCenter);
    } else {
      toaster.push(message, { placement })
    }
  }, [placement]);

  const CompactCell = (props: any) => (
    <Table.Cell
      {...props}
      style={{ padding: 4 }}
    />
  );

  const onToolbar = React.useCallback((style: string) => {
    setTableDisplay(style);
    style === 'spreadsheet' && setRowHeight(850);
    style === 'tab' && setRowHeight(200);
    style === 'list' && setRowHeight(500);
  }, [])

  const TabView = (props: any) => {
    const { rowData, dataKey } = props;
    const pns = rowData['private_networks'];
    const serviceNetwork = rowData['service_network'];
    const sslVpn = rowData['ssl_vpn'];
    const evs = rowData['evault'];
    const advmons = rowData['advmon'];
    const icos = rowData['icos'];
    const fileBlock = rowData['file_block'];

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
                              <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{pnKey}: {cidr}</Tag>
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
                              <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag>
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
                              <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag>
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

          {
            activeKey === 'EV' &&
            <TagGroup style={{ marginBottom: "10px" }}>
              {
                evs.map((ev: any, index: any) => {
                  return (
                    <React.Fragment key={`${cellKey}-evault-${index}`}>
                      {
                        ev.cidr_blocks.map((cidr: any, index: any) => {
                          let conflict = false;
                          let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                          let obj = js && getObjects(js, 'cidr_notation', cidr);
                          conflict = obj && obj[0].conflict;

                          return (
                            <React.Fragment key={`${cellKey}-evault-${index}-c`}>
                              <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag>
                            </React.Fragment >
                          )
                        })
                      }
                      {ev.cidr_blocks.length === 0 && <Tag color={undefined}> No data found </Tag>}
                    </React.Fragment>
                  )
                })
              }
            </TagGroup>
          }

          {
            activeKey === 'FB' &&
            <TagGroup style={{ marginBottom: "10px" }}>
              {
                fileBlock.map((fb: any, index: any) => {
                  return (
                    <React.Fragment key={`${cellKey}-file-block-${index}`}>
                      {
                        fb.cidr_blocks.map((cidr: any, index: any) => {
                          let conflict = false;
                          let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                          let obj = js && getObjects(js, 'cidr_notation', cidr);
                          conflict = obj && obj[0].conflict;

                          return (
                            <React.Fragment key={`${cellKey}-file-block-${index}-c`}>
                              <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag>
                            </React.Fragment >
                          )
                        })
                      }
                      {fb.cidr_blocks.length === 0 && <Tag color={undefined}> No data found </Tag>}
                    </React.Fragment>
                  )
                })
              }
            </TagGroup>
          }

          {
            activeKey === 'AM' &&
            <TagGroup style={{ marginBottom: "10px" }}>
              {
                advmons.map((am: any, index: any) => {
                  return (
                    <React.Fragment key={`${cellKey}-advmon-${index}`}>
                      {
                        am.cidr_blocks.map((cidr: any, index: any) => {
                          let conflict = false;
                          let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                          let obj = js && getObjects(js, 'cidr_notation', cidr);
                          conflict = obj && obj[0].conflict;

                          return (
                            <React.Fragment key={`${cellKey}-advmon-${index}-c`}>
                              <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag>
                            </React.Fragment >
                          )
                        })
                      }
                      {am.cidr_blocks.length === 0 && <Tag color={undefined}> No data found </Tag>}
                    </React.Fragment>
                  )
                })
              }
            </TagGroup>
          }

          {
            activeKey === 'IC' &&
            <TagGroup style={{ marginBottom: "10px" }}>
              {
                icos.map((ic: any, index: any) => {
                  return (
                    <React.Fragment key={`${cellKey}-icos-${index}`}>
                      {
                        ic.cidr_blocks.map((cidr: any, index: any) => {
                          let conflict = false;
                          let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                          let obj = js && getObjects(js, 'cidr_notation', cidr);
                          conflict = obj && obj[0].conflict;

                          return (
                            <React.Fragment key={`${cellKey}-icos-${index}-c`}>
                              <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag>
                            </React.Fragment >
                          )
                        })
                      }
                      {ic.cidr_blocks.length === 0 && <Tag color={undefined}> No data found </Tag>}
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

  const ListView = (props: any) => {
    const { rowData, dataKey } = props;
    const pns = rowData['private_networks'];
    const serviceNetwork = rowData['service_network'];
    const sslVpn = rowData['ssl_vpn'];
    const evs = rowData['evault'];
    const advmons = rowData['advmon'];
    const icos = rowData['icos'];
    const fileBlock = rowData['file_block'];

    const cellKey = rowData[dataKey];

    return (
      <Table.Cell key={`${cellKey}`} {...props} style={{ padding: 4 }}>
        <Panel bordered style={{ padding: "5px" }}>
          <strong>Private Network</strong>
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
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{pnKey}: {cidr}</Tag>
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

          <strong>Service Network</strong>
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
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag>
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

          <strong>SSL VPN</strong>
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
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag>
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

          <strong>eVault</strong>
          <TagGroup style={{ marginBottom: "10px" }}>
            {
              evs.map((ev: any, index: any) => {
                return (
                  <React.Fragment key={`${cellKey}-evault-${index}`}>
                    {
                      ev.cidr_blocks.map((cidr: any, index: any) => {
                        let conflict = false;
                        let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                        let obj = js && getObjects(js, 'cidr_notation', cidr);
                        conflict = obj && obj[0].conflict;

                        return (
                          <React.Fragment key={`${cellKey}-evault-${index}-c`}>
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag>
                          </React.Fragment >
                        )
                      })
                    }
                    {ev.cidr_blocks.length === 0 && <Tag color={undefined}> No data found </Tag>}
                  </React.Fragment>
                )
              })
            }
          </TagGroup>

          <strong>File & Block</strong>
          <TagGroup style={{ marginBottom: "10px" }}>
            {
              fileBlock.map((fb: any, index: any) => {
                return (
                  <React.Fragment key={`${cellKey}-file-block-${index}`}>
                    {
                      fb.cidr_blocks.map((cidr: any, index: any) => {
                        let conflict = false;
                        let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                        let obj = js && getObjects(js, 'cidr_notation', cidr);
                        conflict = obj && obj[0].conflict;

                        return (
                          <React.Fragment key={`${cellKey}-file-block-${index}-c`}>
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag>
                          </React.Fragment >
                        )
                      })
                    }
                    {fb.cidr_blocks.length === 0 && <Tag color={undefined}> No data found </Tag>}
                  </React.Fragment>
                )
              })
            }
          </TagGroup>

          <strong>AdvMon (Nimsoft)</strong>
          <TagGroup style={{ marginBottom: "10px" }}>
            {
              advmons.map((am: any, index: any) => {
                return (
                  <React.Fragment key={`${cellKey}-advmon-${index}`}>
                    {
                      am.cidr_blocks.map((cidr: any, index: any) => {
                        let conflict = false;
                        let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                        let obj = js && getObjects(js, 'cidr_notation', cidr);
                        conflict = obj && obj[0].conflict;

                        return (
                          <React.Fragment key={`${cellKey}-advmon-${index}-c`}>
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag>
                          </React.Fragment >
                        )
                      })
                    }
                    {am.cidr_blocks.length === 0 && <Tag color={undefined}> No data found </Tag>}
                  </React.Fragment>
                )
              })
            }
          </TagGroup>

          <strong>ICOS</strong>
          <TagGroup style={{ marginBottom: "10px" }}>
            {
              icos.map((ic: any, index: any) => {
                return (
                  <React.Fragment key={`${cellKey}-icos-${index}`}>
                    {
                      ic.cidr_blocks.map((cidr: any, index: any) => {
                        let conflict = false;
                        let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                        let obj = js && getObjects(js, 'cidr_notation', cidr);
                        conflict = obj && obj[0].conflict;

                        return (
                          <React.Fragment key={`${cellKey}-icos-${index}-c`}>
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag>
                          </React.Fragment >
                        )
                      })
                    }
                    {ic.cidr_blocks.length === 0 && <Tag color={undefined}> No data found </Tag>}
                  </React.Fragment>
                )
              })
            }
          </TagGroup>

        </Panel>
      </Table.Cell>
    );
  };

  const TableView = (props: any) => {
    const { rowData, dataKey } = props;
    const pns = rowData['private_networks'];
    const serviceNetwork = rowData['service_network'];
    const sslVpn = rowData['ssl_vpn'];
    const evs = rowData['evault'];
    const advmons = rowData['advmon'];
    const icos = rowData['icos'];
    const fileBlock = rowData['file_block'];

    const cellKey = rowData[dataKey];

    return (
      <Table.Cell key={`${cellKey}`} {...props} style={{ padding: 4 }}>
        <Panel style={{ padding: "5px" }}>
          <table>
            <thead>
              <tr>
                <th>Used for</th>
                <th>IP range</th>
                <th>BCR</th>
              </tr>
            </thead>
            <tbody>
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
                              <tr>
                                <td>Private Network</td>
                                {conflict ?
                                  <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag></td>
                                  :
                                  <td>{cidr}</td>
                                }
                                <td>{pnKey}</td>
                              </tr>
                            </React.Fragment>
                          )
                        })
                      }
                    </React.Fragment >
                  )
                })
              }

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
                              <tr>
                                <td>Service Network</td>
                                {conflict ?
                                  <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag></td>
                                  :
                                  <td>{cidr}</td>
                                }
                              </tr>
                            </React.Fragment >
                          )
                        })
                      }
                    </React.Fragment>
                  )
                })
              }

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
                              <tr>
                                <td>SSL VPN</td>
                                {conflict ?
                                  <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag></td>
                                  :
                                  <td>{cidr}</td>
                                }
                              </tr>
                            </React.Fragment >
                          )
                        })
                      }
                    </React.Fragment>
                  )
                })
              }

              {
                evs.map((ev: any, index: any) => {
                  return (
                    <React.Fragment key={`${cellKey}-evault-${index}`}>
                      {
                        ev.cidr_blocks.map((cidr: any, index: any) => {
                          let conflict = false;
                          let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                          let obj = js && getObjects(js, 'cidr_notation', cidr);
                          conflict = obj && obj[0].conflict;

                          return (
                            <React.Fragment key={`${cellKey}-evault-${index}-c`}>
                              <tr>
                                <td>eVault</td>
                                {conflict ?
                                  <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag></td>
                                  :
                                  <td>{cidr}</td>
                                }
                              </tr>
                            </React.Fragment >
                          )
                        })
                      }
                    </React.Fragment>
                  )
                })
              }

              {
                fileBlock.map((fb: any, index: any) => {
                  return (
                    <React.Fragment key={`${cellKey}-file-block-${index}`}>
                      {
                        fb.cidr_blocks.map((cidr: any, index: any) => {
                          let conflict = false;
                          let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                          let obj = js && getObjects(js, 'cidr_notation', cidr);
                          conflict = obj && obj[0].conflict;

                          return (
                            <React.Fragment key={`${cellKey}-file-block-${index}-c`}>
                              <tr>
                                <td>File & Block</td>
                                {conflict ?
                                  <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag></td>
                                  :
                                  <td>{cidr}</td>
                                }
                              </tr>
                            </React.Fragment >
                          )
                        })
                      }
                    </React.Fragment>
                  )
                })
              }

              {
                advmons.map((am: any, index: any) => {
                  return (
                    <React.Fragment key={`${cellKey}-advmon-${index}`}>
                      {
                        am.cidr_blocks.map((cidr: any, index: any) => {
                          let conflict = false;
                          let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                          let obj = js && getObjects(js, 'cidr_notation', cidr);
                          conflict = obj && obj[0].conflict;

                          return (
                            <React.Fragment key={`${cellKey}-advmon-${index}-c`}>
                              <tr>
                                <td>AdvMon (Nimsoft)</td>
                                {conflict ?
                                  <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag></td>
                                  :
                                  <td>{cidr}</td>
                                }
                              </tr>
                            </React.Fragment >
                          )
                        })
                      }
                    </React.Fragment>
                  )
                })
              }

              {
                icos.map((ic: any, index: any) => {
                  return (
                    <React.Fragment key={`${cellKey}-icos-${index}`}>
                      {
                        ic.cidr_blocks.map((cidr: any, index: any) => {
                          let conflict = false;
                          let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                          let obj = js && getObjects(js, 'cidr_notation', cidr);
                          conflict = obj && obj[0].conflict;

                          return (
                            <React.Fragment key={`${cellKey}-icos-${index}-c`}>
                              <tr>
                                <td>ICOS</td>
                                {conflict ?
                                  <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["data_center"], rowData["cidr_networks"])}>{cidr}</Tag></td>
                                  :
                                  <td>{cidr}</td>
                                }
                              </tr>
                            </React.Fragment >
                          )
                        })
                      }
                    </React.Fragment>
                  )
                })
              }
            </tbody>
          </table>

        </Panel>
      </Table.Cell>
    );
  };

  const DataCenterCell = React.useCallback((props: any) => {
    const { rowData, dataKey } = props;
    return (
      <Table.Cell {...props}>
        {rowData['conflict'] ?
          <React.Fragment>
            <Tag color={'red'}><AiOutlineCloudServer />  {rowData[dataKey]}</Tag>
          </React.Fragment>
          :
          <React.Fragment>
            <Tag color={undefined}><AiOutlineCloudServer />  {rowData[dataKey]}</Tag>
          </React.Fragment>
        }
      </Table.Cell>
    );
  }, []);

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

  React.useEffect(() => {
    if (filterValue) {
      setItemsValue(_allItems?.filter(i => i.country.toLowerCase().indexOf(filterValue) > -1))
    }
  }, [_allItems, filterValue]);

  const handleSortColumn = (sortColumn: any, sortType: any) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const onDownloadJSON = () => {
    const json = JSON.stringify(items);
    const url = window.URL.createObjectURL(new Blob([json]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ibmcloud.json');
    document.body.appendChild(link);
    link.click();
  }

  const onGetDetails = (cidrValue: string) => {
    axios.post(`/api/getdetails`, {
      cidr: cidrValue,
      filter: filterValue
    }, {
      headers: {
        'content-type': 'application/json',
      }
    })
      .then((response) => {
        setRequestedCidrNetwork(response.data);
      })

  }

  return (
    <CustomProvider
      theme={isLight ? "light" : "dark"}
    >
      <Affix>
        <HeaderNav onToolbar={onToolbar} setLight={setLight} isLight={isLight} issuesUrl={issuesUrl} elementDisabled={elementDisabled} />
      </Affix>

      <Container style={{ paddingLeft: "15px", paddingRight: "15px", paddingTop: "20px" }}>
        <Content>
          <Grid fluid>
            <Col sm={7} md={5} lg={3}>
              <Affix top={76}>
                <InputSection
                  isSortedDescending={isSortedDescending}
                  setRequestedCidrNetwork={setRequestedCidrNetwork}
                  setAllItemsValue={setAllItemsValue}
                  filterValue={filterValue}
                  setFilterValue={setFilterValue}
                  elementDisabled={elementDisabled}
                  _allItems={_allItems}
                  setItemsValue={setItemsValue}
                  setElementDisabled={setElementDisabled}
                />
              </Affix>
            </Col>

            <Col sm={17} md={19} lg={18}>
              <Panel bordered style={{ padding: "5px" }}>
                <React.Fragment>
                  <React.Fragment>
                    <Table
                      virtualized
                      autoHeight
                      affixHeader={50}
                      height={420}
                      data={sortData(sortColumn, sortType, items)}
                      sortColumn={sortColumn}
                      sortType={sortType}
                      onSortColumn={handleSortColumn}
                      loading={loading}
                      rowKey={'key'}
                      renderEmpty={filterValue === '' ? () => <Loader backdrop content="loading..." vertical /> : undefined}
                      showHeader={items.length !== 0 ? true : false}
                      wordWrap
                      rowHeight={rowHeight}
                    >
                      <Table.Column
                        width={50}
                        sortable
                        flexGrow={1}
                      >
                        <Table.HeaderCell>Data Center</Table.HeaderCell>
                        <DataCenterCell dataKey="data_center" style={{ padding: 4 }} />
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
                        {
                          tableDisplay === 'tab' ? <TabView dataKey="data_center" /> :
                            tableDisplay === 'list' ? <ListView dataKey="data_center" /> :
                              <TableView dataKey="data_center" />
                        }
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

                  <DocPanel activeKey={activeKey} />

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

      <Footer style={{ textAlign: "center" }}>
        <p style={{ margin: "25px" }}>
          A project by <a target="_blank" rel="noreferrer" href="http://blog.maisonprosper.com/">Dimitri Prosper</a>
        </p>
      </Footer>

      <Drawer size={'md'} placement={'right'} open={isPanelOpen} onClose={() => setIsPanelOpen(false)} onEnter={() => setActive('cidr1')}>
        <Drawer.Header>
          <Drawer.Title>Conflict Dashboard</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <div key={'cidr0'}>
            <Grid fluid style={{ marginBottom: "10px" }}>
              <Row>
                <Col xs={24} sm={12} md={8}>
                  <label>CIDR Notation:</label>
                  <InputGroup>
                    <Input disabled value={requestedCidrNetwork?.cidr_notation} />
                    {requestedCidrNetwork?.assignable_hosts === 0 &&
                      <Whisper placement="top" controlId="control-id-hover" trigger="hover"
                        speaker={
                          <Tooltip>
                            Get CIDR details.
                          </Tooltip>
                        }>
                        <InputGroup.Button aria-label='get cidr details' onClick={() => onGetDetails(requestedCidrNetwork?.cidr_notation)}>
                          <MdFindReplace />
                        </InputGroup.Button>
                      </Whisper>
                    }
                  </InputGroup>

                  {requestedCidrNetwork?.assignable_hosts !== 0 &&
                    <React.Fragment>
                      <label>Wildcard Mask:</label>
                      <Input disabled value={requestedCidrNetwork?.wildcard_mask} />
                      <label>First Assignable Host:</label>
                      <Input disabled value={requestedCidrNetwork?.first_assignable_host} />
                    </React.Fragment>
                  }
                </Col>
                {requestedCidrNetwork?.assignable_hosts !== 0 &&
                  <React.Fragment>
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
                  </React.Fragment>
                }
              </Row>
            </Grid>
          </div>

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
