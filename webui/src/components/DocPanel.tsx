
import * as React from 'react';
import {
  Button,
  Drawer
} from 'rsuite';

interface IProps {
  activeKey: string | number | undefined
}

export const DocPanel = ({
  activeKey
}: IProps) => {

  const [isDocOpen, setIsDocOpen] = React.useState(false);
  const [activeDoc, setDocActive] = React.useState<(string | number | undefined)>(undefined);

  const openDocPanel = React.useCallback((doc: string) => {
    setIsDocOpen(true);
    setDocActive(doc);
  }, []);

  return (
    <React.Fragment>
      {activeKey === 'PN' &&
        <React.Fragment>
          <p style={{ marginTop: '20px' }}><strong>Private Network</strong></p>
          <p>
            Private Network includes the IP ranges used by compute resources deployed in the selected data center.
            <Button size="xs" style={{ fontSize: '12px' }} appearance='subtle' onClick={() => openDocPanel('private_network')}>
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
            <Button size="xs" style={{ fontSize: '12px' }} appearance='subtle' onClick={() => openDocPanel('service_network')}>
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
            <Button size="xs" style={{ fontSize: '12px' }} appearance='subtle' onClick={() => openDocPanel('ssl_vpn')}>
              more...
            </Button>
          </p>
        </React.Fragment>
      }

      {activeKey === 'EV' &&
        <React.Fragment>
          <p style={{ marginTop: '20px' }}><strong>eVault</strong></p>
          <p>
            eVault
            <Button size="xs" style={{ fontSize: '12px' }} appearance='subtle' onClick={() => openDocPanel('evault')}>
              more...
            </Button>
          </p>
        </React.Fragment>
      }

      {activeKey === 'FB' &&
        <React.Fragment>
          <p style={{ marginTop: '20px' }}><strong>File & Block</strong></p>
          <p>
            File & Block
            <Button size="xs" style={{ fontSize: '12px' }} appearance='subtle' onClick={() => openDocPanel('file_block')}>
              more...
            </Button>
          </p>
        </React.Fragment>
      }

      {activeKey === 'AM' &&
        <React.Fragment>
          <p style={{ marginTop: '20px' }}><strong>AdvMon</strong></p>
          <p>
            AdvMon (Nimsoft)
            <Button size="xs" style={{ fontSize: '12px' }} appearance='subtle' onClick={() => openDocPanel('advmon')}>
              more...
            </Button>
          </p>
        </React.Fragment>
      }

      {activeKey === 'IC' &&
        <React.Fragment>
          <p style={{ marginTop: '20px' }}><strong>ICOS</strong></p>
          <p>
            ICOS
            <Button size="xs" style={{ fontSize: '12px' }} appearance='subtle' onClick={() => openDocPanel('icos')}>
              more...
            </Button>
          </p>
        </React.Fragment>
      }

      <Drawer size={'sm'} placement={'right'} open={isDocOpen} onClose={() => setIsDocOpen(false)} >
        <Drawer.Header>
          <Drawer.Title>
            {activeDoc === 'private_network' && <span>Private Network</span>}
            {activeDoc === 'service_network' && <span>Service Network</span>}
            {activeDoc === 'ssl_vpn' && <span>SSL VPN</span>}
            {activeDoc === 'evault' && <span>eVault</span>}
            {activeDoc === 'file_block' && <span>File & Block</span>}
            {activeDoc === 'advmon' && <span>AdvMon</span>}
            {activeDoc === 'icos' && <span>ICOS</span>}
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
          {activeDoc === 'evault' &&
            <span>
              Required Flows:

              Outbound TCP 8086 and TCP 8087 from your private
              VLANs to IP ranges documented in DAL09 and DAL10 only. *
              Outbound TCP 2546 from your private VLANs to IP ranges
              documented for each DC where you need to access your vault. *
            </span>
          }
          {activeDoc === 'file_block' &&
            <span>
              File & Block details...
            </span>
          }
          {activeDoc === 'advmon' &&
            <span>
              AdvMon details...
            </span>
          }
          {activeDoc === 'icos' &&
            <span>
              ICOS details...
            </span>
          }
        </Drawer.Body>
      </Drawer>
    </React.Fragment>
  )
}