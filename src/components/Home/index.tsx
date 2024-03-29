import MetaTags from "@components/common/MetaTags";
import ExploreFeed from "@components/Explore/Feed";
import Layout from "@components/wrappers/Layout";
import useAppStore from "@lib/store";
import { NextPage } from "next";
import dynamic from "next/dynamic";

import HomeFeed from "./Feed";
const Recommended = dynamic(() => import("./Recommended"));

const Home: NextPage = () => {
  const { selectedChannel, token } = useAppStore();
  return (
    <Layout>
      <MetaTags title="Home" />
      <Recommended />
      <div className="md:my-5">
        {selectedChannel && token.access ? <HomeFeed /> : <ExploreFeed />}
      </div>
    </Layout>
  );
};

export default Home;
