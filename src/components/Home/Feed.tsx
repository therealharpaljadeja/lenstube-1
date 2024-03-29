import { useQuery } from "@apollo/client";
import Timeline from "@components/Home/Timeline";
import { Loader } from "@components/ui/Loader";
import { NoDataFound } from "@components/ui/NoDataFound";
import useAppStore from "@lib/store";
import { LENSTUBE_VIDEOS_APP_ID } from "@utils/constants";
import { FEED_QUERY } from "@utils/gql/queries";
import React, { useState } from "react";
import { useInView } from "react-cool-inview";
import { PaginatedResultInfo } from "src/types";
import { LenstubePublication } from "src/types/local";

const HomeFeed = () => {
  const [videos, setVideos] = useState<LenstubePublication[]>([]);
  const [pageInfo, setPageInfo] = useState<PaginatedResultInfo>();
  const { selectedChannel } = useAppStore();

  const { data, loading, error, fetchMore } = useQuery(FEED_QUERY, {
    variables: {
      request: {
        profileId: selectedChannel?.id,
        limit: 10,
        sources: [LENSTUBE_VIDEOS_APP_ID],
      },
    },
    fetchPolicy: "no-cache",
    onCompleted(data) {
      setPageInfo(data?.timeline?.pageInfo);
      setVideos(data?.timeline?.items);
    },
  });

  const { observe } = useInView({
    threshold: 0.7,
    onEnter: () => {
      fetchMore({
        variables: {
          request: {
            profileId: selectedChannel?.id,
            cursor: pageInfo?.next,
            limit: 10,
            sources: [LENSTUBE_VIDEOS_APP_ID],
          },
        },
      }).then(({ data }: any) => {
        setPageInfo(data?.timeline?.pageInfo);
        setVideos([...videos, ...data?.timeline?.items]);
      });
    },
  });

  if (data?.length === 0) {
    return <NoDataFound text="No videos yet." />;
  }

  return (
    <div>
      {loading && <Loader />}
      {!error && !loading && (
        <>
          <Timeline videos={videos} />
          {pageInfo?.next && videos.length !== pageInfo?.totalCount && (
            <span ref={observe} className="flex justify-center p-5">
              <Loader />
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default HomeFeed;
