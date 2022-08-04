import * as React from 'react';
import ReactMarkdown from 'react-markdown'
import axios from "axios";
import remarkGfm from 'remark-gfm'

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
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        img: ({ node, ...props }) => <img alt="" style={{ display: 'block', margin: 'auto', maxWidth: '75%' }}  {...props} />,
        h2: ({ node, className, children, ...props }) => <h2 style={{ margin: 'revert' }} {...props}>{children}</h2>,
        h5: ({ node, className, children, ...props }) => <h5 style={{ marginTop: '20px', marginBottom: '5px' }} {...props}>{children}</h5>,
      }}
      >
        {contents}
      </ReactMarkdown>
    </React.Fragment>
  )
}