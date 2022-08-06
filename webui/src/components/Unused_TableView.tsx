import * as React from 'react';
import {
  Table,
  Panel,
  Tag,
} from 'rsuite';

import { getObjects } from '../utils';


export const TableView = (props: any) => {
  const { rowData, dataKey, openPanel } = props;
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
                                <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag></td>
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
                                <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag></td>
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
                                <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag></td>
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
                                <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag></td>
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
                                <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag></td>
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
                                <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag></td>
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
                                <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag></td>
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
              rhels.map((rh: any, index: any) => {
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
                            <tr>
                              <td>RHELS</td>
                              {conflict ?
                                <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag></td>
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
              ims.map((im: any, index: any) => {
                return (
                  <React.Fragment key={`${cellKey}-rhels-${index}`}>
                    {
                      im.cidr_blocks.map((cidr: any, index: any) => {
                        let conflict = false;
                        let js = rowData["cidr_networks"] && JSON.parse(JSON.stringify(rowData["cidr_networks"]));
                        let obj = js && getObjects(js, 'cidr_notation', cidr);
                        conflict = obj && obj[0].conflict;

                        return (
                          <React.Fragment key={`${cellKey}-rhels-${index}-c`}>
                            <tr>
                              <td>IMS</td>
                              {conflict ?
                                <td><Tag color={'red'} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag></td>
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