import { useQuery } from "@apollo/client";
import Timeline from "@components/Home/Timeline";
import { Loader } from "@components/ui/Loader";
import { NoDataFound } from "@components/ui/NoDataFound";
import { LENSTUBE_VIDEOS_APP_ID } from "@utils/constants";
import { PROFILE_FEED_QUERY } from "@utils/gql/queries";
import React, { FC, useState } from "react";
import { useInView } from "react-cool-inview";
import { PaginatedResultInfo, Profile } from "src/types";
import { LenstubePublication } from "src/types/local";

type Props = {
  channel: Profile;
};

const CommentedVideos: FC<Props> = ({ channel }) => {
  const [channelVideos, setChannelVideos] = useState<LenstubePublication[]>([]);
  const [pageInfo, setPageInfo] = useState<PaginatedResultInfo>();
  const { data, loading, error, fetchMore } = useQuery(PROFILE_FEED_QUERY, {
    variables: {
      request: {
        publicationTypes: "COMMENT",
        profileId: channel?.id,
        limit: 10,
        sources: [LENSTUBE_VIDEOS_APP_ID],
      },
    },
    skip: !channel?.id,
    onCompleted(data) {
      setPageInfo(data?.publications?.pageInfo);
      setChannelVideos(data?.publications?.items);
    },
  });
  const { observe } = useInView({
    onEnter: () => {
      fetchMore({
        variables: {
          request: {
            publicationTypes: "COMMENT",
            profileId: channel?.id,
            cursor: pageInfo?.next,
            limit: 10,
            sources: [LENSTUBE_VIDEOS_APP_ID],
          },
        },
      }).then(({ data }: any) => {
        setPageInfo(data?.publications?.pageInfo);
        setChannelVideos([...channelVideos, ...data?.publications?.items]);
      });
    },
  });

  if (loading) {
    return <Loader />;
  }

  if (data?.publications?.items?.length === 0) {
    return <NoDataFound text="No comments on videos." />;
  }

  return (
    <div className="w-full">
      {!error && !loading && (
        <div>
          <Timeline videos={channelVideos} />
          {pageInfo?.next && channelVideos.length !== pageInfo?.totalCount && (
            <span ref={observe} className="flex justify-center p-5">
              <Loader />
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentedVideos;
