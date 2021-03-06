import { Components, registerComponent, } from '../../lib/vulcan-lib';
import NoSSR from 'react-no-ssr';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import Typography from '@material-ui/core/Typography';
import { legacyBreakpoints } from '../../lib/utils/theme';
import { useHover } from '../common/withHover';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    ...theme.typography.postStyle,

    width: "calc(33% - 5px)",
    boxShadow: "0 0 3px rgba(0,0,0,.2)",
    paddingBottom: 0,
    marginBottom: 10,
    display: "flex",
    flexDirection: "column",

    "&:hover": {
      boxShadow: "0 1px 6px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.12)",
      color: "rgba(0,0,0,0.87)",
    },

    [legacyBreakpoints.maxSmall]: {
      width: "335px !important",
    },
    [legacyBreakpoints.maxTiny]: {
      width: "100% !important",
      padding: "14px 10px 12px 10px !important",
    },
  },

  title: {
    fontSize: 16,
    lineHeight: 1.0,
    maxHeight: 32,
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
    textOverflow: "ellipsis",
    overflow: "hidden",
    fontVariant: "small-caps",
    marginBottom: 0,
    "&:hover": {
      color: "inherit",
      textDecoration: "none",
    }
  },

  draft: {
    textTransform: "uppercase",
    color: "rgba(100, 169, 105, 0.9)",
  },

  author: {
    color: "rgba(0,0,0,0.5)",
  },

  meta: {
    paddingLeft: 12,
    paddingTop: 12,
    paddingRight: 8,
    paddingBottom: 5,
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  hiddenAuthor: {
    paddingBottom: 8
  },
  image: {
    backgroundColor: "#efefef",
    display: 'block',
    height: 95,
    "& img": {
      [legacyBreakpoints.maxSmall]: {
        width: "305px !important",
        height: "auto !important",
      },
      width: "100%",
      height: 95,
      [legacyBreakpoints.maxTiny]: {
        width: "100% !important",
      },
    }
  }
})

const SequencesGridItem = ({ sequence, showAuthor=false, classes }: {
  sequence: SequencesPageFragment,
  showAuthor?: boolean,
  classes: ClassesType

}) => {
  const getSequenceUrl = () => {
    return '/s/' + sequence._id
  }
  const { hover, anchorEl } = useHover()
  const { PopperCard, SequenceTooltip, LinkCard } = Components;
  const url = getSequenceUrl()

  return <LinkCard className={classes.root} to={url}>
    <div className={classes.image}>
      <NoSSR>
        <Components.CloudinaryImage
          publicId={sequence.gridImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg"}
          height={124}
          width={315}
        />
      </NoSSR>
    </div>
    <div className={classNames(classes.meta, {[classes.hiddenAuthor]:!showAuthor})}>
      <Link key={sequence._id} to={url}>
        <Typography variant='title' className={classes.title}>
          {sequence.draft && <span className={classes.draft}>[Draft] </span>}
          {sequence.title}
        </Typography>
      </Link>
      { showAuthor &&
        <div className={classes.author}>
          by <Components.UsersName user={sequence.user} />
        </div>}
    </div>
    <PopperCard open={hover} anchorEl={anchorEl}>
      <SequenceTooltip sequence={sequence}/>
    </PopperCard>
  </LinkCard>
}

const SequencesGridItemComponent = registerComponent('SequencesGridItem', SequencesGridItem, {styles});

declare global {
  interface ComponentTypes {
    SequencesGridItem: typeof SequencesGridItemComponent
  }
}

