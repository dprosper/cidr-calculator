import * as React from 'react';
import {
  Table,
  Panel,
  Tag,
  TagGroup
} from 'rsuite';
import ResponsiveNav from '@rsuite/responsive-nav';

import { getObjects } from '../utils';

const topLevelTabs = [
  { eventKey: 'PN', label: 'Private Network' },
  { eventKey: 'SN', label: 'Service Network' },
  { eventKey: 'SV', label: 'SSL VPN' },
  { eventKey: 'EV', label: 'eVault' },
  { eventKey: 'FB', label: 'File & Block' },
  { eventKey: 'AM', label: 'AdvMon (Nimsoft)' },
  { eventKey: 'IC', label: 'ICOS' },
  { eventKey: 'RH', label: 'RHELS' },
  { eventKey: 'IM', label: 'IMS' },
];

export const TabView = (props: any) => {
  const { rowData, dataKey, openpanel } = props;
  const pns = rowData['private_networks'];
  const serviceNetwork = rowData['service_network'];
  const sslVpn = rowData['ssl_vpn'];
  const evs = rowData['evault'];
  const advmons = rowData['advmon'];
  const rhels = rowData['rhe_ls'];
  const ims = rowData['ims'];
  const icos = rowData['icos'];
  const fileBlock = rowData['file_block'];

  const cellKey = rowData[dataKey];
  const [activeKey, setActiveKey] = React.useState<(string | number | undefined)>('PN');

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
            {pns && pns.length === 0 && <Tag color={undefined}> None available </Tag>}

            {
              pns && pns.map((pn: any, index: any) => {
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
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openpanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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
            {serviceNetwork && serviceNetwork.length === 0 && <Tag color={undefined}> None available </Tag>}

            {
              serviceNetwork && serviceNetwork.map((service: any, index: any) => {
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
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openpanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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
            {sslVpn && sslVpn.length === 0 && <Tag color={undefined}> None available </Tag>}

            {
              sslVpn && sslVpn.map((ssl: any, index: any) => {
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
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openpanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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
            {evs && evs.length === 0 && <Tag color={undefined}> None available </Tag>}

            {
              evs && evs.map((ev: any, index: any) => {
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
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openpanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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
            {fileBlock && fileBlock.length === 0 && <Tag color={undefined}> None available </Tag>}

            {
              fileBlock && fileBlock.map((fb: any, index: any) => {
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
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openpanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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
            {advmons && advmons.length === 0 && <Tag color={undefined}> None available </Tag>}

            {
              advmons && advmons.map((am: any, index: any) => {
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
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openpanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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
            {icos && icos.length === 0 && <Tag color={undefined}> None available </Tag>}

            {
              icos && icos.map((ic: any, index: any) => {
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
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openpanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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

        {
          activeKey === 'RH' &&
          <TagGroup style={{ marginBottom: "10px" }}>
            {rhels && rhels.length === 0 && <Tag color={undefined}> None available </Tag>}

            {
              rhels && rhels.map((rh: any, index: any) => {
                return (
                  <React.Fragment key={`${cellKey}-rhels-${index}`}>
                    {
                      rh.cidr_blocks.map((cidr: any, index: any) => {
                        let conflict = false;
                        let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                        let obj = js && getObjects(js, 'cidr_notation', cidr);
                        conflict = obj && obj[0].conflict;

                        return (
                          <React.Fragment key={`${cellKey}-rhels-${index}-c`}>
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openpanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
                          </React.Fragment >
                        )
                      })
                    }
                    {rh.cidr_blocks.length === 0 && <Tag color={undefined}> No data found </Tag>}
                  </React.Fragment>
                )
              })
            }
          </TagGroup>
        }

        {
          activeKey === 'IM' &&
          <TagGroup style={{ marginBottom: "10px" }}>
            {ims && ims.length === 0 && <Tag color={undefined}> None available </Tag>}

            {
              ims && ims.map((im: any, index: any) => {
                return (
                  <React.Fragment key={`${cellKey}-ims-${index}`}>
                    {
                      im.cidr_blocks.map((cidr: any, index: any) => {
                        let conflict = false;
                        let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                        let obj = js && getObjects(js, 'cidr_notation', cidr);
                        conflict = obj && obj[0].conflict;

                        return (
                          <React.Fragment key={`${cellKey}-ims-${index}-c`}>
                            <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openpanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
                          </React.Fragment >
                        )
                      })
                    }
                    {im.cidr_blocks.length === 0 && <Tag color={undefined}> No data found </Tag>}
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