import * as React from 'react';
import {
  Button,
  Drawer,
  Row,
  Col,
  Nav
} from 'rsuite';
import { AiOutlineRocket } from 'react-icons/ai';
import { MdOutlineHelpCenter } from 'react-icons/md';
import { Docs } from './Docs';

interface IDemoProps {
  active: string,
  setActive: (value: string) => void,
}

const Menu = ({
  active,
  setActive,
}: IDemoProps) => {

  return (
    <Nav appearance="subtle" reversed vertical activeKey={active} onSelect={setActive} style={{ fontSize: '14px' }}>
      <Nav.Item eventKey="start" icon={<AiOutlineRocket />}>
        Getting started
      </Nav.Item>
      <Nav.Item eventKey="help" icon={<MdOutlineHelpCenter />} >
        FAQs
      </Nav.Item>
    </Nav>
  );
};

export const DocPanel = () => {

  const [isDocOpen, setIsDocOpen] = React.useState(false);
  const [active, setActive] = React.useState('start');

  const openDocPanel = React.useCallback(() => {
    setIsDocOpen(true);
  }, []);

  return (
    <React.Fragment>
      <React.Fragment>
        <p style={{ marginTop: '20px' }}><strong>Documentation</strong></p>
        <p>
          Use this tool to identify potential conflicts between IP ranges in your on-premises environment(s) and IP ranges used in IBM Cloud.
        </p>
        <Button size="xs" style={{ fontSize: '12px', marginTop: '10px' }} appearance='subtle' onClick={() => openDocPanel()}>
          Learn more.
        </Button>
      </React.Fragment>
      <Drawer size={'full'} placement={'right'} open={isDocOpen} onClose={() => setIsDocOpen(false)} >
        <Drawer.Header>
          <Drawer.Title>
            <span>CIDR Conflict Calculator Documentation</span>
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body style={{ padding: '30px 30px' }}>
          <Row>
            <Col md={4}>
              <Menu active={active} setActive={setActive} />
            </Col>
            <Col md={20}>
              {active === 'start' &&
                <Docs doc='getting-started.md' />
              }
              {active === 'help' &&
                <Docs doc='help.md' />
              }
            </Col>
          </Row>
        </Drawer.Body>
      </Drawer>
    </React.Fragment>
  )
}