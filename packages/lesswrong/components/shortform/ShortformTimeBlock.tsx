import React, { Component } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withMulti } from '../../lib/crud/withMulti';
import { Comments } from '../../lib/collections/comments';
import {queryIsUpdating} from '../common/queryStatusUtils'

const styles = theme => ({
  shortformGroup: {
    marginTop: 12,
  },
  subtitle: {
    [theme.breakpoints.down('sm')]:{
      paddingBottom: theme.spacing.unit*1.5,
    },
    paddingBottom: theme.spacing.unit
  },
})

interface ExternalProps {
  reportEmpty: any,
  terms: any,
}
interface ShortformTimeBlockProps extends ExternalProps, WithStylesProps {
  networkStatus: any,
  results: Array<ShortformComments>|null,
  totalCount: number,
  loadMore: any,
}

class ShortformTimeBlock extends Component<ShortformTimeBlockProps> {
  componentDidMount () {
    const {networkStatus, results: comments} = this.props
    this.checkEmpty(networkStatus, comments)
  }

  componentDidUpdate (prevProps) {
    const {networkStatus: prevNetworkStatus} = prevProps
    const {networkStatus, results: comments} = this.props
    if (prevNetworkStatus !== networkStatus) {
      this.checkEmpty(networkStatus, comments)
    }
  }

  checkEmpty (networkStatus, comments) {
    const { reportEmpty } = this.props
    // https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/src/core/networkStatus.ts
    // 1-4 indicate query is in flight
    // There's a double negative here. We want to know if we did *not* find
    // shortform, because if there's no content for a day, we don't render.
    if (!queryIsUpdating(networkStatus) && !comments?.length && reportEmpty) {
      reportEmpty()
    }
  }

  render () {
    const { totalCount, loadMore, results: comments, classes } = this.props
    const { CommentsNode, LoadMore, SectionSubtitle, SubSection, ContentType } = Components
    if (!comments?.length) return null
    return <div>
      <div className={classes.shortformGroup}>
        <SectionSubtitle className={classes.subtitle}>
          <ContentType type="shortform" label="Shortform"/>
        </SectionSubtitle>
        <SubSection>
          {comments?.map((comment, i) =>
            <CommentsNode
              comment={comment} post={comment.post}
              key={comment._id}
              forceSingleLine loadChildrenSeparately
            />)}
          {comments?.length < totalCount &&
          <LoadMore
            loadMore={loadMore}
            count={comments.length}
            totalCount={totalCount}
          />
          }
        </SubSection>
      </div>
    </div>
  }
}

const ShortformTimeBlockComponent = registerComponent<ExternalProps>('ShortformTimeBlock', ShortformTimeBlock, {
  styles,
  hocs: [
    withMulti({
      collection: Comments,
      fragmentName: 'ShortformComments',
      fetchPolicy: 'cache-and-network',
      enableTotal: true,
      limit: 5,
      ssr: true,
    }),
  ]
});

declare global {
  interface ComponentTypes {
    ShortformTimeBlock: typeof ShortformTimeBlockComponent
  }
}

