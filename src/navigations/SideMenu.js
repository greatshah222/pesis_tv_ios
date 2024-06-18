import {
	StyleSheet,
	Text,
	View,
	SafeAreaView,
	Image,
	FlatList,
	Pressable,
	Alert,
	ActivityIndicator,
} from "react-native";
import React from "react";
import { useTranslation } from "react-i18next";

import Container from "../components/common/Container";
import { SETTINGS, PROFILE, LANGUAGE } from "../constants/routeNames";
import logoutUser from "../context/actions/logoutAction";
import Icon from "../components/common/Icon";
import colors from "../assets/themes/colors";

export default function SideMenu({ authDispatch, navigation }) {
	// we cant use navigation hook cause we cannot close drawer if we use hook
	//   const navigation = useNavigation();
	const { t } = useTranslation();

	const handleLogout = () => {
		navigation.toggleDrawer();
		Alert.alert(
			t("shared.logoutMessage1"),
			t("shared.logoutMessage2"),

			[
				{
					text: t("shared.cancel"),
					onPress: () => {},
				},
				{
					text: t("shared.ok"),
					onPress: () => {
						logoutUser()(authDispatch);
					},
				},
			]
		);
	};
	const menuItems = [
		{
			icon: <Icon name="user-secret" size={21} style={styles.icomenu} type="fontisto" />,
			name: t("screens.profile"),
			onPress: () => {
				navigation.navigate(PROFILE);
			},
		},

		{
			icon: <Icon name="language" type={"ionicons"} size={21} style={styles.icomenu} />,
			name: t("screens.language"),
			onPress: () => {
				navigation.navigate(LANGUAGE);
			},
		},
		{
			icon: <Icon name="settings" type={"material"} size={21} style={styles.icomenu} />,
			name: t("screens.settings"),
			onPress: () => {
				navigation.navigate(SETTINGS);
			},
		},
		{
			icon: <Icon name="logout" type={"material"} size={21} style={styles.icomenu} />,
			name: t("screens.logout"),
			onPress: () => handleLogout(),
		},
	];

	return (
		<SafeAreaView>
			<Container style={{ padding: 0 }}>
				<View
					style={{
						backgroundColor: colors.primary,
						flex: 1,
					}}
				>
					<Image source={require("../assets/images/logo.png")} style={styles.logo} />
					<View style={styles.container}>
						{menuItems.map((el) => (
							<Pressable
								onPress={el.onPress}
								key={el.name}
								style={(({ pressed }) => pressed && styles.pressed, styles.pressableContainer)}
							>
								<View>{el.icon}</View>
								<View>
									<Text style={styles.itemText}>{el.name}</Text>
								</View>
							</Pressable>
						))}
					</View>
				</View>
			</Container>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	logo: {
		height: 80,
		width: "100%",
		alignSelf: "center",
		resizeMode: "contain",
		backgroundColor: colors.primary,
		padding: 0,
		margin: 0,
		marginTop: 50,
	},
	pressed: {
		opacity: 0.5,
	},

	pressableContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	itemText: {
		fontSize: 21,
		paddingVertical: 15,
		paddingLeft: 30,
		// backgroundColor: 'red',
		width: 200,
	},
	container: {
		paddingTop: 20,
		backgroundColor: colors.white,
	},
});
