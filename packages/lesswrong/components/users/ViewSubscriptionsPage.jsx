import React from 'react';
import { Components, registerComponent, useMulti, useSingle } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { Subscriptions } from '../../lib/collections/subscriptions/collection.js';
import { useCurrentUser } from '../common/withUser.js';

const styles = {
  subscribedItem: {
    display: "flex",
  },
  subscribedItemDescription: {
    flexGrow: 1,
  },
};

const SubscriptionsList = ({collectionName, fragmentName, subscriptionType, noSubscriptionsMessage, renderDocument, title}) => {
  const { SubscribedItem, SectionTitle } = Components;
  const currentUser = useCurrentUser();
  
  const { results, loading } = useMulti({
    terms: {
      view: "subscriptionsOfType",
      userId: currentUser?._id,
      collectionName: collectionName,
      subscriptionType: subscriptionType,
    },
    collection: Subscriptions,
    queryName: "SubscriptionsOfTypeQuery",
    fragmentName: "SubscriptionState",
  });
  
  if (!currentUser)
    return null;
  if (!results)
    return null;
  
  return <div>
    <SectionTitle title={title}/>
    {results.map(result =>
      <SubscribedItem
        key={result._id}
        collectionName={collectionName}
        fragmentName={fragmentName}
        subscription={result}
        renderDocument={renderDocument}
      />
    )}
    {results.length===0 && <div>
      {noSubscriptionsMessage}
    </div>}
  </div>
}
registerComponent("SubscriptionsList", SubscriptionsList);

const SubscribedItem = ({collectionName, fragmentName, subscription, renderDocument, classes}) => {
  const { Loading, SubscribeTo } = Components;
  const { document, loading, error } = useSingle({
    documentId: subscription.documentId,
    collectionName, fragmentName,
    queryName: "SubscribedDocumentQuery",
  });
  
  if (loading)
    return <Loading/>
  
  return <div className={classes.subscribedItem}>
    <div className={classes.subscribedItemDescription}>
    {renderDocument(document)}
    </div>
    <SubscribeTo
      document={document}
      subscriptionType={subscription.type}
      subscribeMessage="Resubscribe"
      unsubscribeMessage="Unsubscribe"
    />
  </div>
  
}
registerComponent("SubscribedItem", SubscribedItem,
  withStyles(styles, {name: "SubscribedItem"}));

const ViewSubscriptionsPage = ({classes}) => {
  const { SingleColumnSection, SubscriptionsList, UsersNameDisplay } = Components;
  const currentUser = useCurrentUser();
  
  if (!currentUser) {
    return <SingleColumnSection>
      Log in to manage your subscriptions.
    </SingleColumnSection>;
  }
  
  return <SingleColumnSection>
    <SubscriptionsList
      title="Subscribed to Posts By Users"
      collectionName="Users"
      subscriptionType="newPosts"
      fragmentName="UsersMinimumInfo"
      renderDocument={user => <UsersNameDisplay user={user}/>}
      noSubscriptionsMessage="You are not subscribed to any users' posts."
    />
    
    <SubscriptionsList
      title="Subscribed to Comments on Posts"
      collectionName="Posts"
      subscriptionType="newComments"
      fragmentName="PostsList"
      renderDocument={post => post.title}
      noSubscriptionsMessage="You are not subscribed to comments on any posts."
    />
    
    <SubscriptionsList
      title="Subscribed to Local Groups"
      collectionName="LocalGroups"
      subscriptionType="newEvents"
      fragmentName=""
      renderDocument={group => group.title}
      noSubscriptionsMessage="You are not subscribed to any local groups."
    />
  </SingleColumnSection>;
}

registerComponent("ViewSubscriptionsPage", ViewSubscriptionsPage,
  withStyles(styles, {name: "ViewSubscriptionsPage"}));