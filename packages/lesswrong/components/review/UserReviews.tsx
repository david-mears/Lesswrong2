import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import Users from '../../lib/collections/users/collection';

const UserReviews = () => {
  const { params: { slug } } = useLocation();
  const { results, loading } = useMulti({
    collection: Users,
    fragmentName: 'UsersProfile',
    enableTotal: false,
    ssr: true,
    terms: {view: 'usersProfile', slug}
  });

  const user = results?.length ? results[0] : null
  const { SingleColumnSection, RecentComments, SectionTitle, Loading, Error404 } = Components

  if (loading) return <Loading />
  if (!user) return <Error404 />

  const nominationTerms = { 
    view: "nominations2018",
    userId: user._id,
    limit: 50
  }

  const reviewTerms = { 
    view: "reviews2018",
    userId: user._id,
    limit: 50
  }

  return (
    <SingleColumnSection>
      <SectionTitle title={`${user.displayName}'s 2018 Reviews`}/>
      <RecentComments terms={reviewTerms} noResultsMessage="No Reviews Found"/>
      <SectionTitle title={`${user.displayName}'s 2018 Nominations`}/>
      <RecentComments terms={nominationTerms} noResultsMessage="No Nominations Found"/>
    </SingleColumnSection>
  )

};

const UserReviewsComponent = registerComponent('UserReviews', UserReviews);

declare global {
  interface ComponentTypes {
    UserReviews: typeof UserReviewsComponent
  }
}

