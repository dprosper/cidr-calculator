import * as React from 'react';
import ReactMarkdown from 'react-markdown'
import axios from "axios";

interface IProps {
  doc: string,
}

export const Docs = ({
  doc,
}: IProps) => {

  const [contents, setContents] = React.useState<(string)>('');

  React.useEffect(() => {
    axios.get(`/docs/${doc}`)
      .then((response) => {
        setContents(response.data);
      });

  }, [doc]);

  return (
    <React.Fragment>
      <ReactMarkdown components={{
        img: ({ node, ...props }) => <img alt="" style={{ display: 'block', margin: 'auto', maxWidth: '75%' }}  {...props} />
      }}
      >{contents}</ReactMarkdown>
    </React.Fragment>
  )
}