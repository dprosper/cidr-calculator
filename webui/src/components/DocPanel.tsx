
import * as React from 'react';
import {
  Button,
  Drawer,
  Grid,
  Row,
  Col,
  Tag
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
      <React.Fragment>
        <p style={{ marginTop: '20px' }}><strong>Tool Documentation</strong></p>
        <p>
          Use this tool to identify potential conflicts between IP ranges in your on-premises environment(s) and IP ranges used in IBM Cloud.
        </p>
        <p>Results are color coded:</p>
        <Grid fluid>
          <Row>
            <Col xs={24} sm={24} md={24}>
              <Tag color={'green'} >clear</Tag>
              <Tag color={'red'} >conflict</Tag>
            </Col>
          </Row>
        </Grid>
        <Button size="xs" style={{ fontSize: '12px', marginTop: '10px' }} appearance='subtle' onClick={() => openDocPanel('usage')}>
          Learn more.
        </Button>
      </React.Fragment>
      <Drawer size={'sm'} placement={'right'} open={isDocOpen} onClose={() => setIsDocOpen(false)} >
        <Drawer.Header>
          <Drawer.Title>
            {activeDoc === 'usage' && <span>Usage Documentation</span>}
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          {activeDoc === 'usage' &&
            <React.Fragment>
              <p>
                Use this tool to identify potential conflicts between IP ranges in your on-premises environment(s) and IP ranges used in IBM Cloud.
              </p>
              <p>Results are color coded:</p>
              <Grid fluid>
                <Row>
                  <Col xs={24} sm={24} md={24}>
                    <Tag color={'green'} >clear</Tag>
                    <Tag color={'red'} >conflict</Tag>
                  </Col>
                </Row>
              </Grid>
            </React.Fragment>
          }
        </Drawer.Body>
      </Drawer>
    </React.Fragment>
  )
}