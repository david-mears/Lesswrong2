import { makeEditableOptions, Chapters } from './collection.js'
import { addEditableCallbacks } from '../../../server/editor/make_editable_callbacks.js';
import { Sequences } from '../sequences/collection.js';
import { Posts } from '../posts/collection.js'
import { addCallback } from 'meteor/vulcan:core';

addEditableCallbacks({collection: Chapters, options: makeEditableOptions})

async function ChaptersEditCanonizeCallback (chapter) {
  const posts = await Sequences.getAllPosts(chapter.sequenceId)
  const sequence = await Sequences.findOne({_id:chapter.sequenceId})

  posts.forEach((currentPost, i) => {

    const validSequenceId = (currentPost, sequence) => {
      // Only update a post if it either doesn't have a canonicalSequence, or if we're editing
      // chapters *from* its canonicalSequence
      return !currentPost.canonicalSequenceId || currentPost.canonicalSequenceId === sequence._id
    }

    if ((currentPost.userId === sequence.userId) && validSequenceId(currentPost, sequence)) {
      let prevPost = {slug:""}
      let nextPost = {slug:""}
      if (i-1>=0) {
        prevPost = posts[i-1]
      }
      if (i+1<posts.length) {
        nextPost = posts[i+1]
      }
      Posts.update({slug: currentPost.slug}, {$set: {
        canonicalPrevPostSlug: prevPost.slug,
        canonicalNextPostSlug: nextPost.slug,
        canonicalSequenceId: chapter.sequenceId,
      }});
    }
  })
  return chapter
}

addCallback("chapters.new.async", ChaptersEditCanonizeCallback);
addCallback("chapters.edit.async", ChaptersEditCanonizeCallback);
