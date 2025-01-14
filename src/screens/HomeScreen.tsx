import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Orientation from "react-native-orientation-locker";

import PlayTopNCards from "@/components/home/PlayTopNCards";
import HorizontalScrollCards from "@/components/home/HorizontalScrollCards";
import MediaCards from "@/components/home/MediaCards";
import Error from "@/components/common/Error";
import Header from "@/components/common/Header";
import TagRail from "@/components/home/TagRail";
import HomeSkeletonPlaceholder from "@/components/home/HomeSkeletonPlaceholder";

import { useGetAllTags } from "@/apis/tags/Queries/useGetAllTags";
import { useGetLatestUploadsMediaList } from "@/apis/media/Queries/useGetLatestUploadsMediaList";
import { useGetMostWeeklyPlayedMediaList } from "@/apis/media/Queries/useGetMostWeeklyPlayedMediaList";
import { useGetPlayTopNMediaList } from "@/apis/media/Queries/useGetPlayTopNMediaList";

import { SIZES } from "@/styles/theme";
import { storage } from "@/constants/storage";

import mostWeeklyMediaList from "@/constants/mostWeeklyMediaList";

const Home = ({ navigation }) => {
  const [filteredTagList, setFilteredTagList] = useState<string[]>([]); // 빈 배열을 초기화하고 타입을 명시적으로 지정
  const [_, setRefreshing] = useState(false);

  const channelId = storage.getString("channelId");

  // 모든 데이터 재요청 보내는 함수
  const fetchData = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchTags(),
      refetchUploads(),
      // refetchWeekly(),
      refetchTopN(),
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    console.log("[VIEW] Home");
    Orientation.lockToPortrait();
    fetchData();
  }, []);

  // 전체 태그 리스트
  const {
    data: tagList,
    isLoading: tagsLoading,
    isError: tagsError,
    refetch: refetchTags,
  } = useGetAllTags(channelId);

  // 최신 업로드 미디어 리스트
  const {
    data: currentUploadedMediaList,
    isLoading: uploadsLoading,
    isError: uploadsError,
    refetch: refetchUploads,
  } = useGetLatestUploadsMediaList({ channelId, limit: 5 });

  // 최근 일주일동안 가장 많이 재생된 비디오
  // const {
  //   data: objectList,
  //   isLoading: weeklyLoading,
  //   isError: weeklyError,
  //   refetch: refetchWeekly,
  // } = useGetMostWeeklyPlayedMediaList(channelId);

  // opensource 배포를 위한 임시 로직
  const objectList = mostWeeklyMediaList[channelId ?? ""] || [];

  // TOP5 미디어 정보
  const {
    data: playTopNMediaList,
    isLoading: playTopNLoading,
    isError: playTopNError,
    refetch: refetchTopN,
  } = useGetPlayTopNMediaList({ objectList, channelId });

  const handleTagSelect = (selectedTag: string) => {
    if (selectedTag === "전체") {
      setFilteredTagList(tagList); // 전체 선택 시 모든 태그 표시
    } else {
      setFilteredTagList(tagList.filter((tag) => tag === selectedTag)); // 선택한 태그에 해당하는 항목만 필터링
    }
  };

  // tagList 비어있을 떄 아닐 떄 구분 로직
  const completeTagList = tagList.length > 0 ? ["전체", ...tagList] : tagList;

  // 데이터 요청하는 동안 로딩화면
  if (tagsLoading || uploadsLoading || /* weeklyLoading || */ playTopNLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} />
        <HomeSkeletonPlaceholder />
      </SafeAreaView>
    );
  }

  // 잘못된 데이터 요청 시 에러화면
  if (tagsError || uploadsError || /* weeklyError || */ playTopNError) {
    return <Error onRetry={fetchData} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />
      <ScrollView style={styles.contentsArea}>
        <View style={styles.playTopNArea}>
          <Text style={styles.subTitle}>최근 일주일 동안</Text>
          <Text style={styles.mainTitle}>가장 많이 재생된 Top5</Text>
          <PlayTopNCards
            mediaList={playTopNMediaList}
            channelId={channelId}
            navigation={navigation}
          />
        </View>
        <View style={styles.currentArea}>
          <Text style={styles.sectionTitle}>최신 업로드</Text>
          <HorizontalScrollCards
            mediaList={currentUploadedMediaList}
            channelId={channelId}
            navigation={navigation}
          />
        </View>
        <View style={styles.tagListArea}>
          <TagRail tagList={completeTagList} onTagSelect={handleTagSelect} />
          {(filteredTagList.length > 0 ? filteredTagList : tagList).map(
            (tagName, tagIdx) => (
              <View key={tagIdx} style={styles.byTagArea}>
                <View style={styles.titleContainer}>
                  <Text style={styles.sectionTitle}># {tagName}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate("MediaList", {
                        categorized: "tag",
                        categorizedId: tagName,
                        headerTitle: "#" + tagName,
                      });
                    }}
                  >
                    <Text style={styles.viewMoreText}>더보기</Text>
                  </TouchableOpacity>
                </View>
                <MediaCards categorizedId={tagName} navigation={navigation} />
              </View>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
  },
  contentsArea: {
    width: "100%",
    flex: 1,
  },
  playTopNArea: {
    width: "100%",
    height: ((SIZES.width - 30) * 9) / 16 + 60 + 80,
    marginBottom: 10,
    marginTop: 10,
  },
  currentArea: {
    width: "100%",
    height: ((SIZES.width - 30) * 7) / 16 + 60 + 80,
    marginTop: 10,
  },
  tagListArea: {
    width: "100%",
    flex: 1,
  },
  byTagArea: {
    width: "100%",
    height: 175,
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  mainTitle: {
    fontFamily: "Pretendard-ExtraBold",
    color: "#ffffff",
    marginLeft: 10,
    fontSize: 34,
    textAlign: "left",
    textAlignVertical: "center",
  },
  subTitle: {
    fontFamily: "Pretendard-SemiBold",
    color: "#B3B3B3",
    marginLeft: 10,
    fontSize: 18,
    textAlign: "left",
  },
  sectionTitle: {
    fontFamily: "Pretendard-Bold",
    color: "#ffffff",
    marginLeft: 10,
    fontSize: 26,
    textAlign: "left",
    textAlignVertical: "center",
  },
  viewMoreText: {
    fontFamily: "Pretendard-Medium",
    fontSize: 16,
    color: "#898989",
    textAlign: "right",
    marginRight: 10,
  },
});

export default Home;
