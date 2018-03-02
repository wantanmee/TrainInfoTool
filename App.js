import React from 'react';
import { FlatList, ActivityIndicator, Text, View, Picker  } from 'react-native';

const HOST = "https://kyfw.12306.cn";
const INIT_PAGE_PATH = "/otn/leftTicket/init";
export default class Train extends React.Component {

  constructor(props){
    super(props);
    this.state ={ 
      isLoading: false,
      stations: [],
      origin: "", 
      end: ""
    }
  }

  componentDidMount(){
    this.setState({
      ...this.state,
      isLoading: true
    });
    fetch(`${HOST}${INIT_PAGE_PATH}`)
    .then((respPage) => {
        const stationNamePattern = /<script type="text\/javascript" src="(.+station_name.+)" xml:space="preserve"><\/script>/g;
        const matches = stationNamePattern.exec(respPage._bodyText);        
        const stationNamePath = matches[1];
        return stationNamePath;
      })
    .then((stationNamePath) => fetch(`${HOST}${stationNamePath}`))
    .then(resp => {
      const respBody = resp._bodyText;      
      const stationNames = respBody.match(/'(.+)'/);
      if (stationNames[1]) {
        const stationList = stationNames[1].slice(1).split('@');
        const stations = stationList.map(stationStr => {
          const station = stationStr.split("|");
          // bjb|北京北|VAP|beijingbei|bjb|0
          return ({
            id: station[0],
            name: station[1],
            key: station[2],
            pinyin: station[3],
            initial: station[4],
            order: station[5]
          });
        });        
        this.setState({
          ...this.state,
          isLoading: false,
          stations,
        });            
      }  
    })
    .catch((error) =>{
        console.error(error);
        this.setState({
          ...this.state,
          isLoading: false
        });
      });
  }
  handleOriginStationChange(value, index) {   
    this.setState({
      ...this.state,
      origin: this.state.stations[index]
    });
  }
  handleEndStationChange(value, index) {   
    this.setState({
      ...this.state,
      end: this.state.stations[index]
    });
  }
  buildStationPickerItem() {
    return this.state.stations.map(station => (<Picker.Item label={station.name} value={station.key} key={station.key} />));
  }
  render(){
    if(this.state.isLoading){
      return(
        <View style={{flex: 1, padding: 20}}>
          <ActivityIndicator/>
        </View>
      );
    }
    return(
      <View style={{flex: 1, paddingTop:20}}>
        <Text>Stations: {this.state.stations.length}</Text>        
        <Picker
          selectedValue={this.state.origin.key}
          onValueChange={this.handleOriginStationChange.bind(this)}>
          {this.buildStationPickerItem()}
        </Picker>
        <Picker
          selectedValue={this.state.end.key}
          onValueChange={this.handleEndStationChange.bind(this)}>
          {this.buildStationPickerItem()}
        </Picker>
      </View>
    );
  }
}
