import getProfilePicture from "@utils/functions/getProfilePicture";
import getThumbnailUrl from "@utils/functions/getThumbnailUrl";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import React, { FC } from "react";
import { LenstubePublication } from "src/types/local";

import VideoOptions from "./VideoOptions";

dayjs.extend(relativeTime);

type Props = {
	video: LenstubePublication;
};

const VideoCard: FC<Props> = ({ video }) => {
	return (
		<div className='transition duration-500 ease-in-out rounded-b group bg-secondary'>
			<Link href={`/videos/${video.id}`}>
				<a>
					<div className='rounded-t-lg aspect-w-16 aspect-h-9'>
						<img
							src={getThumbnailUrl(video)}
							alt=''
							draggable={false}
							className='object-cover object-center w-full h-full rounded-t lg:w-full lg:h-full'
						/>
					</div>
				</a>
			</Link>
			<div className='p-2'>
				<div className='flex items-start space-x-2.5'>
					<div className='flex-none'>
						<img
							className='w-8 h-8 rounded-full'
							src={getProfilePicture(video.profile)}
							alt=''
							draggable={false}
						/>
					</div>
					<div className='flex flex-col items-start flex-1 pb-1'>
						<div className='flex w-full items-start justify-between space-x-1.5'>
							<Link href={`/videos/${video.id}`}>
								<a className='mb-1 text-sm font-medium line-clamp-2'>
									{video.metadata?.name}
								</a>
							</Link>
							<VideoOptions />
						</div>
						<Link href={`/${video.profile?.handle}`}>
							<a className='text-xs hover:opacity-100 opacity-70'>
								{video.profile.handle}
							</a>
						</Link>
						<div className='flex items-center text-[11px] opacity-70'>
							<span>
								{dayjs(new Date(video.createdAt)).fromNow()}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default VideoCard;
