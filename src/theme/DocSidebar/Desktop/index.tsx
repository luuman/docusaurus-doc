import React from 'react';
import OriginalDocSidebarDesktop from '@theme-original/DocSidebar/Desktop';

type Props = React.ComponentProps<typeof OriginalDocSidebarDesktop>;

export default function DocSidebarDesktop(props: Props): JSX.Element {
  return <OriginalDocSidebarDesktop {...props} />;
}
