import Users from '../users/collection';
import { foreignKeyField, resolverOnlyField, denormalizedField } from '../../../lib/utils/schemaUtils';
import { Posts } from '../posts/collection'
import { schemaDefaultValue } from '../../collectionUtils';
import { Utils } from '../../vulcan-lib';

const schema = {
  // The `_id` of the parent comment, if there is one
  parentCommentId: {
    ...foreignKeyField({
      idFieldName: "parentCommentId",
      resolverName: "parentComment",
      collectionName: "Comments",
      type: "Comment",
    }),
    canRead: ['guests'],
    canCreate: ['members'],
    optional: true,
    hidden: true,
  },
  // The `_id` of the top-level parent comment, if there is one
  topLevelCommentId: {
    ...foreignKeyField({
      idFieldName: "topLevelCommentId",
      resolverName: "topLevelComment",
      collectionName: "Comments",
      type: "Comment",
    }),
    denormalized: true,
    canRead: ['guests'],
    canCreate: ['members'],
    optional: true,
    hidden: true,
  },
  // The timestamp of comment creation
  createdAt: {
    type: Date,
    optional: true,
    canRead: ['admins'],
    onInsert: (document, currentUser) => new Date(),
  },
  // The timestamp of the comment being posted. For now, comments are always
  // created and posted at the same time
  postedAt: {
    type: Date,
    optional: true,
    canRead: ['guests'],
    onInsert: (document, currentUser) => new Date(),
  },
  // The comment author's name
  author: {
    type: String,
    optional: true,
    canRead: ['guests'],
    onInsert: (document, currentUser) => {
      // if userId is changing, change the author name too
      if (document.userId) {
        return Users.getDisplayNameById(document.userId)
      }
    },
    onEdit: (modifier, document, currentUser) => {
      // if userId is changing, change the author name too
      if (modifier.$set && modifier.$set.userId) {
        return Users.getDisplayNameById(modifier.$set.userId)
      }
    }
  },
  // The post's `_id`
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
    }),
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true
  },
  // The comment author's `_id`
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
  },
  // Whether the comment is deleted. Delete comments' content doesn't appear on the site.
  // FIXME: Not a real field. We inherited this from vulcan-starter, but
  // implemented our own, unrelated soft delete mechanism with the field named
  // `deleted` rather than `isDeleted`.
  isDeleted: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
  },
  userIP: {
    type: String,
    optional: true,
    canRead: ['admins'],
  },
  userAgent: {
    type: String,
    optional: true,
    canRead: ['admins'],
  },
  referrer: {
    type: String,
    optional: true,
    canRead: ['admins'],
  },
  authorIsUnreviewed: {
    type: Boolean,
    optional: true,
    denormalized: true,
    ...schemaDefaultValue(false),
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    hidden: true,
  },

  // GraphQL only fields

  pageUrl: resolverOnlyField({
    type: String,
    canRead: ['guests'],
    resolver: (comment, args, context) => {
      return context.Comments.getPageUrl(comment, true)
    },
  }),

  pageUrlRelative: resolverOnlyField({
    type: String,
    canRead: ['guests'],
    resolver: (comment, args, context) => {
      return context.Comments.getPageUrl(comment, false)
    },
  }),

  answer: {
    type: Boolean,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    ...schemaDefaultValue(false),
  },

  parentAnswerId: {
    ...foreignKeyField({
      idFieldName: "parentAnswerId",
      resolverName: "parentAnswer",
      collectionName: "Comments",
      type: "Comment",
    }),
    denormalized: true,
    canRead: ['guests'],
    canCreate: ['members'],
    optional: true,
    hidden: true,
  },
  
  
  latestChildren: resolverOnlyField({
    type: Array,
    graphQLtype: '[Comment]',
    viewableBy: ['guests'],
    resolver: async (comment, args, { Comments }) => {
      const params = Comments.getParameters({view:"shortformLatestChildren", comment: comment})
      return await Comments.find(params.selector, params.options).fetch()
    }
  }),
  'latestChildren.$': {
    type: String,
    optional: true,
  },
  
  shortform: {
    type: Boolean,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canCreate: ['members', 'admins'],
    canUpdate: [Users.owns, 'admins'],
    ...denormalizedField({
      needsUpdate: data => ('postId' in data),
      getValue: async (comment) => {
        const post = await Posts.findOne({_id: comment.postId});
        if (!post) return false;
        return !!post.shortform;
      }
    }),
  },

  // users can write comments nominating posts for a particular review period.
  // this field is generally set by a custom dialog,
  // set to the year of the review period (i.e. '2018')
  nominatedForReview: {
    type: String,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canCreate: ['members', 'admins'],
    canUpdate: [Users.owns, 'admins'],
  },
  reviewingForReview: {
    type: String,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canCreate: ['members', 'admins'],
    canUpdate: [Users.owns, 'admins'],
  },

  lastSubthreadActivity: {
    type: Date,
    denormalized: true,
    optional: true,
    viewableBy: ['guests'],
    onInsert: (document, currentUser) => new Date(),
  },

  // The semver-style version of the post that this comment was made against
  // This gets automatically created in a callback on creation
  postVersion: {
    type: String,
    optional: true,
    canRead: ['guests'],
    onCreate: async ({newDocument}) => {
      const post = await Posts.findOne({_id: newDocument.postId})
      return (post && post.contents && post.contents.version) || "1.0.0"
    }
  },

  promoted: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
  },

  promotedByUserId: {
    ...foreignKeyField({
      idFieldName: "promotedByUserId",
      resolverName: "promotedByUser",
      collectionName: "Users",
      type: "User"
    }),
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    hidden: true,
    onUpdate: async ({data, currentUser, document, oldDocument}) => {
      if (data?.promoted && !oldDocument.promoted) {
        Utils.updateMutator({
          collection: Posts,
          selector: {_id:document.postId},
          data: { lastCommentPromotedAt: new Date() },
          currentUser,
          validate: false
        })
        return currentUser._id
      }
    }    
  },

  promotedAt: {
    type: Date,
    optional: true,
    canRead: ['guests'],
    onUpdate: async ({data, document, oldDocument}) => {
      if (data?.promoted && !oldDocument.promoted) {
        return new Date()
      }
      if (!document.promoted && oldDocument.promoted) {
        return null
      }
    }
  },
  
  // Comments store a duplicate of their post's hideCommentKarma data. The
  // source of truth remains the hideCommentKarma field of the post. If this
  // field is true, we do not report the baseScore to non-admins. We update it
  // if (for some reason) this comment gets transferred to a new post. The
  // trickier case is updating this on post change. For that we rely on the
  // UpdateCommentHideKarma callback.
  hideKarma: {
    type: Boolean,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canCreate: ['members', 'admins'],
    canUpdate: ['admins'],
    ...denormalizedField({
      needsUpdate: data => ('postId' in data),
      getValue: async comment => {
        const post = await Posts.findOne({_id: comment.postId});
        if (!post) return false;
        return !!post.hideCommentKarma;
      }
    }),
  },
  
  // DEPRECATED field for GreaterWrong backwards compatibility
  wordCount: resolverOnlyField({
    type: Number,
    viewableBy: ['guests'],
    resolver: (comment, args, { Comments }) => {
      const contents = comment.contents;
      if (!contents) return 0;
      return contents.wordCount;
    }
  }),
  // DEPRECATED field for GreaterWrong backwards compatibility
  htmlBody: resolverOnlyField({
    type: String,
    viewableBy: ['guests'],
    resolver: (comment, args, { Comments }) => {
      const contents = comment.contents;
      if (!contents) return "";
      return contents.html;
    }
  }),
};

export default schema;
