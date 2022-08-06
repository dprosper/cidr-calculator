import * as React from 'react';
import {
  Table,
  Panel,
  Tag,
  TagGroup
} from 'rsuite';

import { getObjects } from '../utils';


export const ListView = (props: any) => {
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
                          <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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
                          <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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
                          <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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
                          <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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
                          <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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
                          <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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
                          <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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

        <strong>RHELS</strong>
        <TagGroup style={{ marginBottom: "10px" }}>
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
                          <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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

        <strong>IMS</strong>
        <TagGroup style={{ marginBottom: "10px" }}>
          {
            ims.map((im: any, index: any) => {
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
                          <Tag color={conflict ? 'red' : undefined} style={{ cursor: "pointer" }} onClick={() => openPanel(rowData["name"], rowData["cidr_networks"])}>{cidr}</Tag>
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
      </Panel>
    </Table.Cell>
  );
};