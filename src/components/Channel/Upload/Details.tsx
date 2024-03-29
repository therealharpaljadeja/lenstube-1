import { LENSHUB_PROXY_ABI } from "@abis/LensHubProxy";
import { useMutation } from "@apollo/client";
import { WebBundlr } from "@bundlr-network/client";
import { Button } from "@components/ui/Button";
import ChooseImage from "@components/ui/ChooseImage";
import { Input } from "@components/ui/Input";
import useAppStore from "@lib/store";
import {
  BUNDLR_CURRENCY,
  BUNDLR_WEBSITE_URL,
  LENSHUB_PROXY_ADDRESS,
  LENSTUBE_VIDEOS_APP_ID,
} from "@utils/constants";
import omitKey from "@utils/functions/omitKey";
import { parseToAtomicUnits } from "@utils/functions/parseToAtomicUnits";
import { uploadDataToIPFS } from "@utils/functions/uploadToIPFS";
import { CREATE_POST_TYPED_DATA } from "@utils/gql/queries";
import usePendingTxn from "@utils/hooks/usePendingTxn";
import clsx from "clsx";
import { utils } from "ethers";
import Link from "next/link";
import Plyr from "plyr-react";
import React, { FC, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";
import { MdRefresh } from "react-icons/md";
import { CreatePostBroadcastItemResult } from "src/types";
import {
  BundlrDataState,
  IPFSUploadResult,
  VideoUpload,
  VideoUploadForm,
} from "src/types/local";
import { v4 as uuidv4 } from "uuid";
import {
  useAccount,
  useContractWrite,
  useSigner,
  useSignTypedData,
} from "wagmi";

type Props = {
  video: VideoUpload;
  closeUploadModal: () => void;
};

const Player = React.memo(({ preview }: { preview: string }) => {
  return (
    <Plyr
      source={{
        type: "video",
        sources: [
          {
            src: preview,
            provider: "html5",
          },
        ],
      }}
      options={{
        controls: ["progress", "current-time", "mute", "volume", "fullscreen"],
      }}
    />
  );
});
Player.displayName = "PreviewPlayer";

const Details: FC<Props> = ({ video, closeUploadModal }) => {
  const { data: signer } = useSigner();
  const { data: account } = useAccount();
  const { getBundlrInstance, selectedChannel } = useAppStore();
  const { signTypedDataAsync } = useSignTypedData({
    onError(error) {
      toast.error(error?.message);
    },
  });
  const { data: writePostData, write: writePostContract } = useContractWrite(
    {
      addressOrName: LENSHUB_PROXY_ADDRESS,
      contractInterface: LENSHUB_PROXY_ABI,
    },
    "postWithSig",
    {
      onError(error: any) {
        toast.error(`Failed - ${error?.data?.message ?? error?.message}`);
      },
    }
  );
  const { indexed } = usePendingTxn(writePostData?.hash || "");

  const [bundlrData, setBundlrData] = useState<BundlrDataState>({
    balance: "0",
    estimatedPrice: "0",
    deposit: null,
    instance: null,
    depositing: false,
    showDeposit: false,
  });
  const [isUploadedToBundlr, setIsUploadedToBundlr] = useState(false);
  const [showBundlrDetails, setShowBundlrDetails] = useState(false);
  const [videoMeta, setVideoMeta] = useState<VideoUploadForm>({
    videoThumbnail: null,
    videoSource: null,
    title: "",
    description: "",
  });
  const [buttonText, setButtonText] = useState("Next");

  useEffect(() => {
    if (indexed) {
      closeUploadModal();
      toast.success("Video posted successfully");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexed]);

  const onNext = async () => {
    if (signer && account?.address) {
      setButtonText("Waiting for sign...");
      toast(
        "Please check your wallet for a signature request from bundlr.network"
      );
      const bundlr = await getBundlrInstance(signer);
      setBundlrData((bundlrData) => ({
        ...bundlrData,
        instance: bundlr,
      }));
      setButtonText("Next");
      setShowBundlrDetails(true);
      await fetchBalance(bundlr);
      await estimatePrice(bundlr);
      setButtonText("Start Upload");
    }
  };

  const depositToBundlr = async () => {
    if (bundlrData.instance && bundlrData.deposit) {
      const value = parseToAtomicUnits(
        bundlrData.deposit,
        bundlrData.instance.currencyConfig.base[1]
      );
      if (!value) return toast.error("Invalid deposit amount");
      setBundlrData({ ...bundlrData, depositing: true });
      await bundlrData.instance
        .fund(value)
        .then((res) => {
          toast.success(
            `Deposit of ${utils.formatEther(res?.quantity)} is done!`
          );
        })
        .catch((e) => {
          console.log("🚀 ~ file: Details.tsx ~ depositToBundlr ~ e", e);
          toast.error(
            `Failed - ${
              typeof e === "string" ? e : e.data?.message || e.message
            }`
          );
        })
        .finally(async () => {
          console.log(
            "🚀 ~ file: Details.tsx ~ line 120 ~ .finally ~ bundlrData.instance && account?.address",
            bundlrData.instance && account?.address
          );
          fetchBalance();
          setBundlrData({
            ...bundlrData,
            deposit: null,
            showDeposit: false,
            depositing: false,
          });
        });
    }
  };

  const fetchBalance = async (bundlr?: WebBundlr) => {
    const instance = bundlr || bundlrData.instance;
    if (account?.address && instance) {
      const balance = await instance.getBalance(account.address);
      setBundlrData((bundlrData) => ({
        ...bundlrData,
        balance: utils.formatEther(balance.toString()),
      }));
    }
  };

  const estimatePrice = async (bundlr: WebBundlr) => {
    if (!video.buffer) return;
    const price = await bundlr.utils.getPrice(
      BUNDLR_CURRENCY,
      video.buffer.length
    );
    setBundlrData((bundlrData) => ({
      ...bundlrData,
      estimatedPrice: utils.formatEther(price.toString()),
    }));
  };

  const uploadToBundlr = async () => {
    if (!bundlrData.instance || !video.buffer) return;
    try {
      toast(
        "Please check your wallet for a signature request from bundlr.network"
      );
      const bundlr = bundlrData.instance;
      setButtonText("Uploading...");
      const tags = [{ name: "Content-Type", value: "video/mp4" }];
      const tx = bundlr.createTransaction(video.buffer, {
        tags: tags,
      });
      await tx.sign();
      const response = await bundlr.uploader.chunkedTransactionUploader(
        tx.getRaw(),
        tx.id,
        tx.getRaw().length
      );
      console.log(
        "🚀 ~ file: Details.tsx ~ line 184 ~ onClickUpload ~ response",
        response
      );
      setButtonText("Post the Video");
      fetchBalance(bundlr);
      setVideoMeta((data) => {
        return { ...data, videoSource: response.data };
      });
      setIsUploadedToBundlr(true);
    } catch (error) {
      console.log("🚀 ~ file: Details.tsx ~ onClickUpload ~ error", error);
      toast.error("Failed to upload video!");
      setButtonText("Upload");
      setIsUploadedToBundlr(false);
    }
  };

  const onThumbnailUpload = (data: IPFSUploadResult | null) => {
    if (data) {
      setVideoMeta((prev) => {
        return { ...prev, videoThumbnail: data };
      });
    } else {
      setVideoMeta((prev) => {
        return { ...prev, videoThumbnail: null };
      });
    }
  };

  const [createTypedData] = useMutation(CREATE_POST_TYPED_DATA, {
    onCompleted({
      createPostTypedData,
    }: {
      createPostTypedData: CreatePostBroadcastItemResult;
    }) {
      const { typedData } = createPostTypedData;
      const {
        profileId,
        contentURI,
        collectModule,
        collectModuleInitData,
        referenceModule,
        referenceModuleInitData,
      } = typedData?.value;
      signTypedDataAsync({
        domain: omitKey(typedData?.domain, "__typename"),
        types: omitKey(typedData?.types, "__typename"),
        value: omitKey(typedData?.value, "__typename"),
      }).then((signature) => {
        const { v, r, s } = utils.splitSignature(signature);
        writePostContract({
          args: {
            profileId,
            contentURI,
            collectModule,
            collectModuleInitData,
            referenceModule,
            referenceModuleInitData,
            sig: { v, r, s, deadline: typedData.value.deadline },
          },
        });
      });
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const createPublication = async () => {
    setButtonText("Storing metadata...");
    const { ipfsUrl } = await uploadDataToIPFS({
      version: "1.0.0",
      metadata_id: uuidv4(),
      description: videoMeta.description,
      content: `https://arweave.net/${videoMeta.videoSource?.id}`,
      external_url: null,
      image: videoMeta.videoThumbnail?.ipfsUrl,
      cover: videoMeta.videoThumbnail?.ipfsUrl,
      imageMimeType: videoMeta.videoThumbnail?.type,
      name: videoMeta.title,
      attributes: [
        {
          displayType: "string",
          traitType: "Publication",
          value: "LenstubeVideo",
        },
      ],
      media: [
        {
          item: videoMeta.videoThumbnail?.ipfsUrl,
          type: videoMeta.videoThumbnail?.type,
        },
      ],
      appId: LENSTUBE_VIDEOS_APP_ID,
    }).finally(() => {
      setButtonText("Post Video");
    });
    // TODO: Add fields to select collect and reference module
    createTypedData({
      variables: {
        request: {
          profileId: selectedChannel?.id,
          contentURI: ipfsUrl,
          collectModule: {
            freeCollectModule: {
              followerOnly: true,
            },
          },
          referenceModule: {
            followerOnlyReferenceModule: false,
          },
        },
      },
    });
  };

  const onSubmitForm = async () => {
    if (!isUploadedToBundlr && bundlrData.instance) {
      await uploadToBundlr();
    } else if (videoMeta.videoSource && isUploadedToBundlr) {
      await createPublication();
    } else {
      await onNext();
    }
  };

  return (
    <div className="h-full">
      <div className="grid h-full gap-5 md:grid-cols-2">
        <div>
          <h1 className="font-semibold">Details</h1>
          <div className="mt-4">
            <Input
              label="Title"
              type="text"
              placeholder="Title that describes your video"
              autoComplete="off"
              value={videoMeta.title}
              onChange={(e) =>
                setVideoMeta({ ...videoMeta, title: e.target.value })
              }
            />
          </div>
          <div className="mt-4">
            <div className="flex items-center mb-1 space-x-1.5">
              <div className="text-[11px] font-semibold uppercase opacity-70">
                Description
              </div>
            </div>
            <textarea
              placeholder="More about your video"
              autoComplete="off"
              rows={5}
              className={clsx(
                "bg-white text-sm px-2.5 py-1 rounded-md dark:bg-gray-900 border border-gray-200 dark:border-gray-800 disabled:opacity-60 disabled:bg-gray-500 disabled:bg-opacity-20 outline-none w-full"
              )}
              value={videoMeta.description}
              onChange={(e) =>
                setVideoMeta({ ...videoMeta, description: e.target.value })
              }
            />
          </div>
          <div className="mt-4">
            <ChooseImage
              label="Thumbnail"
              afterUpload={(data: IPFSUploadResult | null) => {
                onThumbnailUpload(data);
              }}
            />
          </div>
        </div>
        <div className="flex flex-col items-start">
          <div
            className={clsx("overflow-hidden rounded-lg", {
              // "rounded-t-lg": bundlrData.uploading,
              // "rounded-lg": !bundlrData.uploading,
            })}
          >
            <Player preview={video.preview} />
          </div>
          {/* <Tooltip content={`Uploading (${80}%)`}>
            <div className="w-full overflow-hidden bg-gray-200 rounded-b-full">
              <div
                className={clsx("bg-indigo-500 bg-brand-500", {
                  "h-[8px]": bundlrData.uploading,
                  "h-0": !bundlrData.uploading,
                })}
                style={{
                  width: `${80}%`,
                }}
              />
            </div>
          </Tooltip> */}
          <span className="mt-2 text-sm font-light opacity-50">
            <b>Note:</b> This video and its data will be uploaded to permanent
            storage and it stays forever.
          </span>
          {showBundlrDetails && (
            <div className="flex flex-col w-full p-4 my-5 space-y-4 border border-gray-200 rounded-lg dark:border-gray-800">
              <div>
                <div className="flex flex-col">
                  <div className="text-[11px] inline-flex rounded justify-between items-center font-semibold uppercase opacity-70">
                    <span className="inline-flex space-x-1.5">
                      <span>Your Balance</span>
                      <button type="button" onClick={() => fetchBalance()}>
                        <MdRefresh className="text-sm" />
                      </button>
                    </span>
                    <Link href={BUNDLR_WEBSITE_URL}>
                      <a target="_blank" rel="noreferer" className="text-[9px]">
                        bundlr.network ({BUNDLR_CURRENCY})
                      </a>
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xl font-semibold">
                      {bundlrData.balance}
                    </span>
                    <span>
                      <button
                        type="button"
                        onClick={() =>
                          setBundlrData({
                            ...bundlrData,
                            showDeposit: !bundlrData.showDeposit,
                          })
                        }
                        className="inline-flex items-center px-1 bg-gray-100 rounded-full dark:bg-gray-800"
                      >
                        <span className="text-[9px] pl-1">Deposit</span>
                        {bundlrData.showDeposit ? (
                          <BiChevronUp />
                        ) : (
                          <BiChevronDown />
                        )}
                      </button>
                    </span>
                  </div>
                </div>
                {bundlrData.showDeposit && (
                  <div className="flex items-end mt-2 space-x-2">
                    <Input
                      label="Amount to deposit"
                      type="number"
                      placeholder="100 MATIC"
                      autoComplete="off"
                      value={bundlrData.deposit || ""}
                      onChange={(e) =>
                        setBundlrData({
                          ...bundlrData,
                          deposit: parseInt(e.target.value),
                        })
                      }
                    />
                    <div>
                      <Button
                        type="button"
                        disabled={bundlrData.depositing}
                        onClick={() => depositToBundlr()}
                        className="mb-0.5"
                      >
                        {bundlrData.depositing ? "Loading" : "Deposit"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-[11px] inline-flex flex-col font-semibold">
                <span className="uppercase opacity-70">
                  Estimated cost to upload
                </span>
                <span className="text-xl font-semibold">
                  {bundlrData.estimatedPrice}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end">
        <span className="mt-4">
          <Button
            variant="secondary"
            onClick={() => closeUploadModal()}
            className="hover:opacity-100 opacity-60"
          >
            Cancel
          </Button>
          <Button onClick={() => onSubmitForm()}>{buttonText}</Button>
        </span>
      </div>
    </div>
  );
};

export default Details;
