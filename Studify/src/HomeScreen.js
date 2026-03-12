
import React from 'react';
import { View, Image, Text, TouchableOpacity, ScrollView, SectionList } from 'react-native';

const menu = [
  {
    title: 'Ultimos conteudos acessados',
    icon: require('../img/Relogio-iconP.png'),
    data: [1,2,3,4],
  },
  {
    title: 'Conteudos para serem revisados',
    icon: require('../img/Pesquisar-iconP.png'),
    data: [1,2,3,4,5],
  },
  {
    title: 'Recomendações',
    icon: require('../img/FitaBookMark-icon.png'),
    data: [1,2,3,4],
  },
];

const HomeScreen = ({ navigator }) => {
  return (
    <View style={styles.main}>
      {/* Botão de menu */}
      <View style={styles.buttons}>
        <TouchableOpacity onPress={() => navigator.navigate('')}>
          <Image source={require('../img/menu.png')} style={styles.logo} />
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <View style={styles.container}>
        {/* Div para os últimos conteúdos acessados | Histórico */}
        <SectionList
        sections={menu}
        keyExtractor={(item, index) => item + index}
        renderSectionHeader={({ section }) => (
          <View style={styles.div}>
            <View style={styles.icones}>
              <Text style={styles.title}>{section.title}</Text>
              <Image source={section.icon} style={styles.frames} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
              {section.data.map((_, i) => (
                <View key={i} style={styles.rectangle} />
              ))}
            </ScrollView>
          </View>
        )}
        renderItem={() => null} 
        showsVerticalScrollIndicator={false}
      />

      </View>

      {/* Header */}
      <View style={styles.header}>
        {/* Botão de pesquisar */}
        <TouchableOpacity onPress={() => navigator.navigate('')}>
          <Image source={require('../img/Pesquisar-iconG.png')} style={styles.logo} />
        </TouchableOpacity>

        {/* Botão de estudos com IA */}
        <TouchableOpacity onPress={() => navigator.navigate('')}>
          <Image source={require('../img/livro.png')} style={styles.logo} />
        </TouchableOpacity>

        {/* Botão do histórico */}
        <TouchableOpacity onPress={() => navigator.navigate('')}>
          <Image source={require('../img/Relogio-iconG.png')} style={styles.logo} />
        </TouchableOpacity>
        
      </View>
    </View>
  );
};

const styles = {
    main: {
        flex: 1,
        backgroundColor: '#22272C',
        paddingHorizontal: 12,
        paddingTop: 40,
      },
      container: {
        flex: 1,
        marginTop: '10%',
        marginLeft: '5%',
      },
      title: {
        marginLeft: 8,  
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'Roboto',
        marginTop: 20,
        marginLeft: 10,
      },
      header: {
        backgroundColor: '#4C545A',
        borderRadius: '5%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        height: '7.5%',
        bottom: '2.5%',
        alignItems: 'center',
        paddingHorizontal: '5%',
      },
      buttons: {
        paddingTop: '10%',
        height: 2.5,
      },
      row: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
        marginTop: 10,
      },
      rectangle: {
        width: 150,
        height: 90,
        backgroundColor: '#ccc',
        borderRadius: 8,
        marginRight: 10,
      },
      logo: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
      },
      frames: {
        width: 30,
        height: 20,
        resizeMode: 'contain',
        marginTop: 10,
        paddingTop: 20,
      },
      icones: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
        gap: 10,
      },
      div: {
        marginTop: '15%',
      },        
    };
export default HomeScreen;

