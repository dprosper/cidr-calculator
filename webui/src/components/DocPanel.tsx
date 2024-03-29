import * as React from 'react';
import {
  Button,
  Drawer,
  Row,
  Col,
  Nav,
  IconButton
} from 'rsuite';
import { AiOutlineRocket } from 'react-icons/ai';
import { MdOutlineQuestionAnswer, MdOutlineCelebration, MdSentimentVeryDissatisfied, MdSentimentVerySatisfied, MdOutlineFeedback } from 'react-icons/md';
import { Docs } from './Docs';
import { AiOutlineLike, AiOutlineCheck, AiOutlineMinus, AiOutlineClose, AiOutlineDislike } from 'react-icons/ai';
import axios from "axios";
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
        <Nav.Item eventKey="feedback" icon={<MdOutlineFeedback />} >
          Feedback
        </Nav.Item>
      </Nav>
    </React.Fragment>

  );
};

interface IProps {
  clientIP: string,
  location: string
}

export const DocPanel = ({
  clientIP,
  location
}: IProps) => {

  const [isDocOpen, setIsDocOpen] = React.useState(false);
  const [feedbackDisabled, setFeedbackDisabled] = React.useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = React.useState(false);
  const [active, setActive] = React.useState('start');
  const [rating, setRating] = React.useState(1);

  const openDocPanel = React.useCallback((selected: string) => {
    setActive(selected);
    setIsDocOpen(true);
  }, []);

  const onFeedback = React.useCallback((rating: number) => {
    setFeedbackDisabled(true);
    setRating(rating)

    axios.post(`/api/feedback`, {
      rating: rating
    }, {
      headers: {
        'content-type': 'application/json',
        'X-Calculator-Client-Ip': clientIP,
        'X-Calculator-Client-Loc': location
      }
    })
      .then((response) => {
        setFeedbackSuccess(true);
        setFeedbackDisabled(false);
      });
  }, [clientIP, location])


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
        <Button size="xs" style={{ fontSize: '12px', marginTop: '10px' }} appearance='primary' onClick={() => openDocPanel('feedback')}>
          Feedback
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
              {active === 'feedback' &&

                <React.Fragment>
                  <Docs doc='feedback.md' />
                  {!feedbackSuccess &&
                    <React.Fragment>
                      <Row>
                        <Col md={2}>
                          <IconButton size="lg" disabled={feedbackDisabled} icon={<AiOutlineLike />} style={{ marginRight: 10 }} color="blue" appearance="subtle" circle onClick={() => onFeedback(5)} />
                          <br />Absolutely
                        </Col>
                        <Col md={2}>
                          <IconButton size="lg" disabled={feedbackDisabled} icon={<AiOutlineCheck />} style={{ marginRight: 10 }} color="blue" appearance="subtle" circle onClick={() => onFeedback(4)} />
                          <br />Somewhat
                        </Col>
                        <Col md={2}>
                          <IconButton size="lg" disabled={feedbackDisabled} icon={<AiOutlineMinus />} style={{ marginRight: 10 }} color="blue" appearance="subtle" circle onClick={() => onFeedback(3)} />
                          <br />Neutral
                        </Col>
                        <Col md={2}>
                          <IconButton size="lg" disabled={feedbackDisabled} icon={<AiOutlineClose />} style={{ marginRight: 10 }} color="blue" appearance="subtle" circle onClick={() => onFeedback(2)} />
                          <br />Not Really
                        </Col>
                        <Col md={2}>
                          <IconButton size="lg" disabled={feedbackDisabled} icon={<AiOutlineDislike />} style={{ marginRight: 10 }} color="blue" appearance="subtle" circle onClick={() => onFeedback(1)} />
                          <br />Not at all
                        </Col>
                        <Col md={12}>
                        </Col>
                      </Row>
                    </React.Fragment>
                  }
                  {feedbackSuccess &&
                    <React.Fragment>
                      {rating > 3 ?
                        <React.Fragment>
                          <MdSentimentVerySatisfied color="#3498FF" style={{ fontSize: '3em', marginRight: 10 }} />
                          Thank you for having provided your feedback, your awesome response was registered.
                          <MdOutlineCelebration color="#3498FF" style={{ fontSize: '3em', marginRight: 10 }} />
                        </React.Fragment>
                        :
                        <React.Fragment>
                          <MdSentimentVeryDissatisfied color="#3498FF" style={{ fontSize: '3em', marginRight: 10 }} />
                          Thank you for having provided your feedback and sorry to dissapoint. Please help us improve by providing more information on your experience in our <a target="_blank" rel="noreferrer" href="https://github.com/dprosper/cidr-calculator/issues">GitHub repository</a>.
                        </React.Fragment>
                      }
                    </React.Fragment>
                  }
                </React.Fragment>
              }

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