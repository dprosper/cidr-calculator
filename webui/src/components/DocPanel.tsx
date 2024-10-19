import * as React from 'react';
import {
  Button,
  Drawer,
  Row,
  Col,
  Nav
} from 'rsuite';
import { AiOutlineRocket } from 'react-icons/ai';
import { MdOutlineQuestionAnswer } from 'react-icons/md';
import { Docs } from './Docs';
import ReactPlayer from 'react-player/youtube'

interface IMenuProps {
  active: string,
  setActive: (value: string) => void,
}

const ResponsivePlayer = () => {
    return (
      <div className='player-wrapper'>
        <ReactPlayer
          className='react-player'
          url='https://youtu.be/1MES_nOYYDw'
          width='100%'
          height='100%'
          controls={true} 
        />
      </div>
    )
  }

const Menu = ({
  active,
  setActive,
}: IMenuProps) => {

  return (
    <React.Fragment>
      <Docs doc='doc-header.md' />
      <hr />
      <Nav appearance="subtle" reversed vertical activeKey={active} onSelect={setActive} style={{ fontSize: '14px' }}>
        <Nav.Item eventKey="start" icon={<AiOutlineRocket />}>
          Getting started
        </Nav.Item>
        <Nav.Item eventKey="help" icon={<MdOutlineQuestionAnswer />} >
          FAQs
        </Nav.Item>
      </Nav>
    </React.Fragment>

  );
};

export const DocPanel = () => {

  const [isDocOpen, setIsDocOpen] = React.useState(false);
  const [active, setActive] = React.useState('start');

  const openDocPanel = React.useCallback((selected: string) => {
    setActive(selected);
    setIsDocOpen(true);
  }, []);

  return (
    <React.Fragment>
      <React.Fragment>
        <p style={{ marginTop: '20px' }}><strong>About this tool</strong></p>
        <p>
          Use this tool to identify potential conflicts between IP ranges in your on-premises environment(s) and IP ranges used in IBM Cloud Classic infrastructure.
        </p>
        <Button size="xs" style={{ fontSize: '12px', marginTop: '10px', marginRight: '2px' }} appearance='primary' onClick={() => openDocPanel('start')}>
          Getting started
        </Button>
        <Button size="xs" style={{ fontSize: '12px', marginTop: '10px' }} appearance='primary' onClick={() => openDocPanel('help')}>
          Frequently asked questions
        </Button>

      </React.Fragment>
      <Drawer size={'full'} placement={'right'} open={isDocOpen} onClose={() => setIsDocOpen(false)} >
        <Drawer.Header>
          <Drawer.Title>
            <span>Documentation</span>
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body style={{ padding: '30px 30px' }}>
          <Row>
            <Col md={4}>
              <Menu active={active} setActive={setActive} />
            </Col>
            <Col md={20}>
              {active === 'start' &&
                <React.Fragment>
                  <Docs doc='getting-started.md' />
                  <ResponsivePlayer />
                </React.Fragment>
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