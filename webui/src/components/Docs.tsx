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
      <ReactMarkdown>{contents}</ReactMarkdown>
    </React.Fragment>
  )
}