import React, { useState, useCallback, useMemo } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { createStyles } from '@material-ui/core/styles';
import { Localgroups } from '../../lib/index';
import { Posts } from '../../lib/collections/posts';
import Users from '../../lib/collections/users/collection';
import { useLocation } from '../../lib/routeUtil';
import { PersonSVG } from './Icons'
import ReactMapGL, { Marker } from 'react-map-gl';
import { Helmet } from 'react-helmet'
import * as _ from 'underscore';
import { DatabasePublicSetting } from '../../lib/publicSettings';

export const mapboxAPIKeySetting = new DatabasePublicSetting<string | null>('mapbox.apiKey', null) // API Key for the mapbox map and tile requests

export const mapsHeight = 440
const mapsWidth = "100vw"

const styles = createStyles(theme => ({
  root: {
    width: mapsWidth,
    height: mapsHeight,
    // We give this a negative margin to make sure that the map is flush with the top
    marginTop: -50,
    [theme.breakpoints.down('sm')]: {
      marginTop: 0,
      marginLeft: -8
    },
    position: "relative"
  },
  communityMap: {},
  mapButton: {
    padding: 10,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    borderRadius: 2,
    width: 120,
    marginBottom: theme.spacing.unit
  },
  hideMap: {
    width: 34,
    padding: 5
  },
  buttonText: {
    marginLeft: 10,
    fontWeight: 500,
    fontFamily: "Roboto",
  },
  mapButtons: {
    alignItems: "flex-end",
    position: "absolute",
    top: 10,
    right: 10,
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.down('md')]: {
      top: 24
    }
  },
  filters: {
    width: 100
  }
}));



// Make these variables have file-scope references to avoid rerending the scripts or map
const defaultCenter = {lat: 39.5, lng: -43.636047}
const CommunityMap = ({ groupTerms, eventTerms, initialOpenWindows = [], center = defaultCenter, zoom = 3, classes, showUsers, showHideMap = false, petrovButton }: {
  groupTerms: any,
  eventTerms: any,
  initialOpenWindows: Array<any>,
  center: any,
  zoom: number,
  classes: ClassesType,
  showUsers?: boolean,
  showHideMap?: boolean,
  petrovButton?: boolean,
}) => {
  const { query } = useLocation()
  const groupQueryTerms = groupTerms || {view: "all", filters: query?.filters || []}

  const [ openWindows, setOpenWindows ] = useState(initialOpenWindows)
  const handleClick = useCallback(
    (id) => { setOpenWindows([id]) }
    , []
  )
  const handleClose = useCallback(
    (id) => { setOpenWindows(_.without(openWindows, id))}
    , [openWindows]
  )

  const [ showEvents, setShowEvents ] = useState(true)
  const [ showGroups, setShowGroups ] = useState(true)
  const [ showIndividuals, setShowIndividuals ] = useState(true)
  const [ showMap, setShowMap ] = useState(true)

  const [ viewport, setViewport ] = useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom: 2
  })
  

  const { results: events = [] } = useMulti({
    terms: eventTerms,
    collection: Posts,
    fragmentName: "PostsList",
    limit: 500,
    ssr: true
  });

  const { results: groups = [] } = useMulti({
    terms: groupQueryTerms,
    collection: Localgroups,
    fragmentName: "localGroupsHomeFragment",
    limit: 500,
    ssr: true
  })

  const { results: users = [] } = useMulti({
    terms: {view: "usersMapLocations"},
    collection: Users,
    fragmentName: "UsersMapEntry",
    limit: 500,
    ssr: true
  })

  const renderedMarkers = useMemo(() => {
    return <React.Fragment>
      {showEvents && <LocalEventsMapMarkers events={events} handleClick={handleClick} handleClose={handleClose} openWindows={openWindows} />}
      {showGroups && <LocalGroupsMapMarkers groups={groups} handleClick={handleClick} handleClose={handleClose} openWindows={openWindows} />}
      {showIndividuals && <Components.PersonalMapLocationMarkers users={users} handleClick={handleClick} handleClose={handleClose} openWindows={openWindows} />}
      <div className={classes.mapButtons}>
        <Components.CommunityMapFilter 
          showHideMap={showHideMap} 
          toggleEvents={() => setShowEvents(!showEvents)} showEvents={showEvents}
          toggleGroups={() => setShowGroups(!showGroups)} showGroups={showGroups}
          toggleIndividuals={() => setShowIndividuals(!showIndividuals)} showIndividuals={showIndividuals}
          setShowMap={setShowMap}
        />
      </div>
    </React.Fragment>
  }, [showEvents, events, handleClick, handleClose, openWindows, showGroups, groups, showIndividuals, users, classes.mapButtons, showHideMap])

  if (!showMap) return null

  return <div className={classes.root}>
      <Helmet> 
        <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css' rel='stylesheet' />
      </Helmet>
      <ReactMapGL
        {...viewport}
        width="100%"
        height="100%"
        mapStyle={"mapbox://styles/habryka/cilory317001r9mkmkcnvp2ra"}
        onViewportChange={viewport => setViewport(viewport)}
        mapboxApiAccessToken={mapboxAPIKeySetting.get() || undefined}
      >
        {renderedMarkers}
      </ReactMapGL>
      {petrovButton && <Components.PetrovDayButton />}
  </div>
}

const personalMapMarkerStyles = theme => ({
  icon: {
    height: 15,
    width: 15,
    fill: '#3f51b5',
    opacity: 0.8
  }
})
const PersonalMapLocationMarkers = ({users, handleClick, handleClose, openWindows, classes}) => {
  const { StyledMapPopup } = Components
  return <React.Fragment>
    {users.map(user => {
      const location = user.mapLocation
      if (!location?.geometry?.location?.lat || !location?.geometry?.location?.lng) return null
      const { geometry: {location: {lat, lng}}} = location
      const htmlBody = {__html: user.htmlMapMarkerText};
      return <React.Fragment key={user._id}>
        <Marker
          latitude={lat}
          longitude={lng}
          offsetLeft={-8}
          offsetTop={-20}
        >
          <span onClick={() => handleClick(user._id)}>
            <PersonSVG className={classes.icon}/>
          </span>
        </Marker>
        {openWindows.includes(user._id) && 
          <StyledMapPopup
            lat={lat}
            lng={lng}
            link={Users.getProfileUrl(user)}
            title={` [User] ${Users.getDisplayName(user)} `}
            onClose={() => handleClose(user._id)}
          >
            <div dangerouslySetInnerHTML={htmlBody} />
          </StyledMapPopup>}
      </React.Fragment>
    })}
  </React.Fragment>
}
const PersonalMapLocationMarkersTypes = registerComponent("PersonalMapLocationMarkers", PersonalMapLocationMarkers, {
  styles: personalMapMarkerStyles
});

const LocalEventsMapMarkers = ({events, handleClick, handleClose, openWindows}) => {
  return events.map((event) => {
    return <Components.LocalEventMarker
      key={event._id}
      event={event}
      handleMarkerClick={handleClick}
      handleInfoWindowClose={handleClose}
      infoOpen={openWindows.includes(event._id)}
      location={event.googleLocation}
    />
  })
}

const LocalGroupsMapMarkers = ({groups, handleClick, handleClose, openWindows}) => {
  return groups.map((group) => {
    return(
      <Components.LocalGroupMarker
        key={group._id}
        group={group}
        handleMarkerClick={handleClick}
        handleInfoWindowClose={handleClose}
        infoOpen={openWindows.includes(group._id)}
        location={group.googleLocation}
      />
    )
  })
}



const CommunityMapComponent = registerComponent("CommunityMap", CommunityMap, { styles });

declare global {
  interface ComponentTypes {
    CommunityMap: typeof CommunityMapComponent
    PersonalMapLocationMarkers: typeof PersonalMapLocationMarkersTypes
  }
}

