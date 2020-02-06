import React, { useState } from 'react';
import { Components } from 'meteor/vulcan:core';
import { hookToHoc } from '../../lib/hocUtils';

interface CommentBoxContextType {
  openCommentBox: any,
  close: any,
}
export const CommentBoxContext = React.createContext<CommentBoxContextType|null>(null);

export const CommentBoxManager = ({ children }) => {
  const [ componentName, setComponentName] = useState<string|null>(null)
  const [ componentProps, setComponentProps] = useState<Record<string,any>|null>(null)

  const CommentBoxComponent = componentName ? Components[componentName] : null;

  const close = () => {
    setComponentName(null)
    setComponentProps(null)
  }

  return (
    <CommentBoxContext.Provider value={{
      openCommentBox: ({componentName, componentProps}) => {
        setComponentName(componentName)
        setComponentProps(componentProps)
      },
      close: close
    }}>
      {children}
      {componentName &&
        <CommentBoxComponent
          {...componentProps}
          onClose={close}
        />
      }
    </CommentBoxContext.Provider>
  );
}

export const useCommentBox = () => React.useContext(CommentBoxContext);
export const withCommentBox = hookToHoc(useCommentBox);
export default withCommentBox;
