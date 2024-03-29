import { gql } from "@apollo/client";

export const REFRESH_AUTHENTICATION_MUTATION = `
  mutation Refresh($request: RefreshRequest!) {
    refresh(request: $request) {
      accessToken
      refreshToken
    }
  }
`;

export const MinimalProfileFields = gql`
  fragment MinimalProfileFields on Profile {
    id
    name
    handle
    bio
    ownedBy
    attributes {
      key
      value
    }
    stats {
      totalFollowers
    }
    picture {
      ... on MediaSet {
        original {
          url
        }
      }
      ... on NftImage {
        uri
      }
    }
    followModule {
      __typename
    }
  }
`;

export const MinimalCollectModuleFields = gql`
  fragment MinimalCollectModuleFields on CollectModule {
    ... on FreeCollectModuleSettings {
      type
    }
    ... on FeeCollectModuleSettings {
      type
      amount {
        asset {
          address
        }
      }
    }
    ... on LimitedFeeCollectModuleSettings {
      type
      amount {
        asset {
          address
        }
      }
    }
    ... on LimitedTimedFeeCollectModuleSettings {
      type
      amount {
        asset {
          address
        }
      }
    }
    ... on TimedFeeCollectModuleSettings {
      type
      amount {
        asset {
          address
        }
      }
    }
  }
`;

export const CommentFields = gql`
  fragment CommentFields on Comment {
    id
    profile {
      ...MinimalProfileFields
    }
    collectedBy {
      address
      defaultProfile {
        handle
      }
    }
    collectModule {
      ...MinimalCollectModuleFields
    }
    stats {
      totalAmountOfComments
      totalAmountOfCollects
    }
    metadata {
      name
      description
      content
      description
      media {
        original {
          url
          mimeType
        }
      }
      attributes {
        value
      }
    }
    commentOn {
      ... on Post {
        pubId: id
        profile {
          ...MinimalProfileFields
        }
        metadata {
          name
          content
        }
      }
      ... on Comment {
        id
        profile {
          ...MinimalProfileFields
        }
        metadata {
          name
          content
        }
      }
    }
    createdAt
    appId
  }
  ${MinimalProfileFields}
  ${MinimalCollectModuleFields}
`;

export const CURRENT_USER_QUERY = gql`
  query CurrentUser($ownedBy: [EthereumAddress!]) {
    profiles(request: { ownedBy: $ownedBy }) {
      items {
        ...MinimalProfileFields
        isDefault
      }
    }
  }
  ${MinimalProfileFields}
`;

export const CHALLENGE_QUERY = gql`
  query Challenge($request: ChallengeRequest!) {
    challenge(request: $request) {
      text
    }
  }
`;

export const AUTHENTICATE_MUTATION = gql`
  mutation Authenticate($request: SignedAuthChallenge!) {
    authenticate(request: $request) {
      accessToken
      refreshToken
    }
  }
`;

export const CREATE_PROFILE_MUTATION = gql`
  mutation CreateProfile($request: CreateProfileRequest!) {
    createProfile(request: $request) {
      ... on RelayerResult {
        txHash
      }
      ... on RelayError {
        reason
      }
    }
  }
`;

export const TX_STATUS_QUERY = gql`
  query HasTxHashBeenIndexed($request: HasTxHashBeenIndexedRequest!) {
    hasTxHashBeenIndexed(request: $request) {
      ... on TransactionIndexedResult {
        indexed
      }
    }
  }
`;

export const PROFILE_QUERY = gql`
  query Profile($request: ProfileQueryRequest!) {
    profiles(request: $request) {
      items {
        id
        handle
        ownedBy
        name
        attributes {
          key
          value
        }
        bio
        stats {
          totalFollowers
          totalFollowing
          totalPosts
          totalComments
        }
        picture {
          ... on MediaSet {
            original {
              url
            }
          }
          ... on NftImage {
            uri
          }
        }
        coverPicture {
          ... on MediaSet {
            original {
              url
            }
          }
        }
        followModule {
          __typename
        }
      }
    }
  }
`;

export const RECOMMENDED_PROFILES_QUERY = gql`
  query RecommendedProfiles {
    recommendedProfiles {
      ...MinimalProfileFields
    }
  }
  ${MinimalProfileFields}
`;

export const NOTIFICATION_COUNT_QUERY = gql`
  query NotificationCount($request: NotificationRequest!) {
    notifications(request: $request) {
      pageInfo {
        totalCount
      }
    }
  }
`;

// currently showing only new follow
export const NOTIFICATIONS_QUERY = gql`
  query Notifications($request: NotificationRequest!) {
    notifications(request: $request) {
      items {
        ... on NewFollowerNotification {
          wallet {
            address
            defaultProfile {
              ...MinimalProfileFields
            }
          }
          createdAt
        }
      }
      pageInfo {
        next
      }
    }
  }
  ${MinimalProfileFields}
`;

export const SEARCH_CHANNELS_QUERY = gql`
  query SearchChannels($request: SearchQueryRequest!) {
    search(request: $request) {
      ... on ProfileSearchResult {
        items {
          ...MinimalProfileFields
        }
      }
    }
  }
  ${MinimalProfileFields}
`;

export const PostFields = gql`
  fragment PostFields on Post {
    id
    profile {
      ...MinimalProfileFields
    }
    collectedBy {
      address
      defaultProfile {
        handle
      }
    }
    collectModule {
      ...MinimalCollectModuleFields
    }
    stats {
      totalAmountOfComments
      totalAmountOfCollects
    }
    metadata {
      name
      description
      content
      description
      media {
        original {
          url
          mimeType
        }
      }
      cover {
        original {
          url
        }
      }
      attributes {
        value
      }
    }
    createdAt
    appId
  }
  ${MinimalProfileFields}
  ${MinimalCollectModuleFields}
`;

export const CollectModuleFields = gql`
  fragment CollectModuleFields on CollectModule {
    ... on FreeCollectModuleSettings {
      type
      contractAddress
      followerOnly
    }
    ... on FeeCollectModuleSettings {
      type
      recipient
      referralFee
      contractAddress
      followerOnly
      amount {
        asset {
          symbol
          address
        }
        value
      }
    }
    ... on LimitedFeeCollectModuleSettings {
      type
      collectLimit
      recipient
      referralFee
      contractAddress
      followerOnly
      amount {
        asset {
          symbol
          address
        }
        value
      }
    }
    ... on LimitedTimedFeeCollectModuleSettings {
      type
      collectLimit
      recipient
      endTimestamp
      referralFee
      contractAddress
      followerOnly
      amount {
        asset {
          symbol
          address
        }
        value
      }
    }
    ... on TimedFeeCollectModuleSettings {
      type
      recipient
      endTimestamp
      referralFee
      contractAddress
      followerOnly
      amount {
        asset {
          symbol
          address
        }
        value
      }
    }
  }
`;

export const EXPLORE_QUERY = gql`
  query Explore($request: ExplorePublicationRequest!) {
    explorePublications(request: $request) {
      items {
        ... on Post {
          ...PostFields
        }
        ... on Comment {
          ...CommentFields
        }
      }
      pageInfo {
        totalCount
        next
      }
    }
  }
  ${PostFields}
  ${CommentFields}
`;

export const FEED_QUERY = gql`
  query HomeFeed($request: TimelineRequest!) {
    timeline(request: $request) {
      items {
        ... on Post {
          ...PostFields
        }
        ... on Comment {
          ...CommentFields
        }
      }
      pageInfo {
        next
        totalCount
      }
    }
  }
  ${PostFields}
  ${CommentFields}
`;

export const PROFILE_FEED_QUERY = gql`
  query ProfileFeed($request: PublicationsQueryRequest!) {
    publications(request: $request) {
      items {
        ... on Post {
          ...PostFields
        }
        ... on Comment {
          ...CommentFields
        }
      }
      pageInfo {
        totalCount
        next
      }
    }
  }
  ${PostFields}
  ${CommentFields}
`;

export const COMMENT_FEED_QUERY = gql`
  query CommentFeed($request: PublicationsQueryRequest!) {
    publications(request: $request) {
      items {
        ... on Comment {
          ...CommentFields
        }
      }
      pageInfo {
        totalCount
        next
      }
    }
  }
  ${CommentFields}
`;

export const CREATE_POST_TYPED_DATA = gql`
  mutation CreatePostTypedData($request: CreatePublicPostRequest!) {
    createPostTypedData(request: $request) {
      id
      expiresAt
      typedData {
        types {
          PostWithSig {
            name
            type
          }
        }
        domain {
          name
          chainId
          version
          verifyingContract
        }
        value {
          nonce
          deadline
          profileId
          contentURI
          collectModule
          collectModuleInitData
          referenceModule
          referenceModuleInitData
        }
      }
    }
  }
`;

export const CREATE_COLLECT_TYPED_DATA = gql`
  mutation CreateCollectTypedData($request: CreateCollectRequest!) {
    createCollectTypedData(request: $request) {
      id
      expiresAt
      typedData {
        types {
          CollectWithSig {
            name
            type
          }
        }
        domain {
          name
          chainId
          version
          verifyingContract
        }
        value {
          nonce
          deadline
          profileId
          pubId
          data
        }
      }
    }
  }
`;

export const VIDEO_DETAIL_QUERY = gql`
  query VideoDetails(
    $request: PublicationQueryRequest!
    $followRequest: DoesFollowRequest!
  ) {
    publication(request: $request) {
      ... on Post {
        ...PostFields
        onChainContentURI
        referenceModule {
          __typename
        }
      }
    }
    doesFollow(request: $followRequest) {
      follows
    }
  }
  ${PostFields}
`;

export const VIDEO_DETAIL_WITH_COLLECT_DETAIL_QUERY = gql`
  query VideoDetailsWithCollect($request: PublicationQueryRequest!) {
    publication(request: $request) {
      ... on Post {
        collectNftAddress
        collectModule {
          ...CollectModuleFields
        }
      }
    }
  }
  ${CollectModuleFields}
`;

export const CREATE_UNFOLLOW_TYPED_DATA = gql`
  mutation UnfollowTypedData($request: UnfollowRequest!) {
    createUnfollowTypedData(request: $request) {
      id
      expiresAt
      typedData {
        domain {
          name
          chainId
          version
          verifyingContract
        }
        types {
          BurnWithSig {
            name
            type
          }
        }
        value {
          nonce
          deadline
          tokenId
        }
      }
    }
  }
`;

export const CREATE_FOLLOW_TYPED_DATA = gql`
  mutation CreateFollowTypedData($request: FollowRequest!) {
    createFollowTypedData(request: $request) {
      id
      expiresAt
      typedData {
        domain {
          name
          chainId
          version
          verifyingContract
        }
        types {
          FollowWithSig {
            name
            type
          }
        }
        value {
          nonce
          deadline
          profileIds
          datas
        }
      }
    }
  }
`;

export const DOES_FOLLOW = gql`
  query ($request: DoesFollowRequest!) {
    doesFollow(request: $request) {
      followerAddress
      profileId
      follows
    }
  }
`;

export const CHANNEL_FOLLOW_MODULE_QUERY = gql`
  query Profile($request: ProfileQueryRequest!) {
    profiles(request: $request) {
      items {
        followModule {
          ... on FeeFollowModuleSettings {
            amount {
              asset {
                name
                symbol
                address
                decimals
              }
              value
            }
            recipient
          }
        }
      }
    }
  }
`;
