import React from 'react';
import { FlatList, ActivityIndicator, Text, View, Picker, Button  } from 'react-native';
import { isEmpty } from 'lodash';
import moment from 'moment';

const HOST = "https://kyfw.12306.cn";
const INIT_PAGE_PATH = "/otn/leftTicket/init";
const LEFT_TICKET_PATH = "/otn/leftTicket/queryZ";
export default class Train extends React.Component {

  constructor(props){
    super(props);
    this.state ={ 
      isLoading: false,
      stations: [],
      origin: {}, 
      end: {},
      enableCheckLeftTicket: false
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
    }, () => this.checkEnableLeftTicketStatus());    
    
  }
  handleEndStationChange(value, index) {   
    this.setState({
      ...this.state,
      end: this.state.stations[index]
    }, () => this.checkEnableLeftTicketStatus());
  }
  checkEnableLeftTicketStatus() {
    this.setState({
      ...this.state,
      enableCheckLeftTicket: !isEmpty(this.state.origin) && !isEmpty(this.state.end)
    });    
  }
  buildStationPickerItem() {
    return this.state.stations.map(station => (<Picker.Item label={station.name} value={station.key} key={station.key} />));
  }
  handleCheckLeftTicket() {
    // https://kyfw.12306.cn/otn/leftTicket/queryZ?leftTicketDTO.train_date=2018-03-01&leftTicketDTO.from_station=BJP&leftTicketDTO.to_station=SHH&purpose_codes=ADULT
    fetch(`${HOST}${LEFT_TICKET_PATH}?leftTicketDTO.train_date=${moment().format("YYYY-MM-DD")}&leftTicketDTO.from_station=${this.state.origin.key}&leftTicketDTO.to_station=${this.state.end.key}&purpose_codes=ADULT`)
    .then((resp) => {
        // const stationNamePattern = /<script type="text\/javascript" src="(.+station_name.+)" xml:space="preserve"><\/script>/g;
        // const matches = stationNamePattern.exec(respPage._bodyText);        
        // const stationNamePath = matches[1];
        // return stationNamePath;
        const respData = JSON.parse(resp._bodyText);
        const stationObj = respData.data.map;
        const ticketInfoArr = respData.data.result;
        // |预订|64000K90620C|K9059|HHQ|OSQ|SGQ|OSQ|01:26|06:40|05:14|N|6SrWBfD9GpM6%2FGsmb5ExvZdSRv5QNTpmLVZKb%2BN1uTFcKCKROJyN4ESPWNM%3D|20180406|3|Q7|14|17        |0|0||||无|||无||无|无|||||10401030|1413|0
        // QISYSZQdXo5YbM%2B51QEV6wAD7cgIcICNzQUCh%2F4j37HrbWxB7w4Pd0Ag2%2BhaoY6ssYulELBGbFik%0AXfVVQ5SJNaMl1kQUczpbMqCsUzFwJ57grvLEmof%2BF7uHSDfzOdAcB0hg7K2mD9V3cygusImS5b1v%0AfWXdVvsg%2FFZ4xOylqk5W6uLPnNRDwbUxur8M%2FAvA1AiSfN%2BHKm4uvyJvdwz3HVhCMAMWF5lkCLOm%0ALxMbg2nUOtkZpKkPgMooLJCSwd6nrhKmac7D2wbiDYHG
        // |预订|62000K90860I|K9083|SYQ|OSQ|SGQ|OSQ|04:49|10:18|05:29|Y|%2FsrC4TaYFFosghzrQfVhXPajfvhOT9a%2BLEXiiYzqQkH%2BnGBh0BU%2BXDdbq8A%3D|20180406|3|Q9|11|16    |0|0||||无|||无||3|无|||||10401030|1413|0
        // buV%2BpAEHmXkoKvrGCrn4MjOx7suaUwxj221VQjC53qj4Lz931ETLi0vm85OCLphT%2BtkZryWc7kE4%0AX9EeXvLU2E398RcGPI0EuvzVvDOoa%2BvXQM8kvh276xikct2IjpIzHECpJOtPmKOP%2Fm44d4Y%2F89zA%0AnrPosMo143yaZVQw0XpZ%2FyC7oBKN37QZ3H%2F6%2BkTYRSKnUNoPgn4plMUHp8Qp1J%2BFgQx6cYUwcm5b%0Aux3dvzpEIs6MfmwxuXOt2Cu7CFWqPchwVaOmZqk%3D
        // |预订|710000K9500E|K951|GBZ|SZQ|SGQ|SZQ|05:07|10:00|04:53|Y|FmM%2F2aa3gSsnykH3bSS7cjZApN%2F0687dFG167C0FqN44Z4SdBGosDedrzYo%3D|20180406|3|Z1|07|09         |0|0||||无|||无||有|有|||||10401030|1413|0"        
        // 9s3UqrnUjX0R1e8VKWJQ1LxeGoaQXhIN4YudBLOQGZwH9dPQsN9NQpJyYf%2FqfcMnefgdcQI%2FNFm8%0AMKjlq%2BeiDSRixio5ApJy333MdrCb31Sw7BTBaLpjXi8JLHvvhVFsthu%2FhCK%2BSut7u2RTDUJXDvC9%0A7btJnbpzFDXOtUyIglIEfGmKyIy%2F1tgasmnIDwT7aIXVwt7Cy%2FArORaOhS%2Bt1VLpVheFBy%2F4Bne8%0A2W0qYCodLc0JPeqWkA%3D%3D
        // |预订|63000K902100|K9021|PSQ|BJQ|SGQ|BJQ|09:32|14:32|05:00|Y|Z1Dk3KZ3nxyvQL9CzF1BSR65MO8ptXsJ|20180407|3|Q6|03|09                                          |0|0||||  |||有  ||   |有  |||||1010|11|0
        // 预订按钮的js|预订按钮字样|<tr>的id|车次|4|5|6|7|出发时间|到达时间|耗时|11|查看票价按钮的 id 组成|日期|查看停靠站信息需要|查看票价按钮的 id 组成|查看票价按钮的 id 组成|0|0||||无|||无座||硬卧|硬座|||||10401030|1413|0
        console.log(respBody);
      })
    .catch(error => {
      console.log("Get left ticket error! ", error);
    })
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
        <Button 
          disabled={!this.state.enableCheckLeftTicket}
          onPress={this.handleCheckLeftTicket.bind(this)}
          title="查询余票"         
        />
      </View>
    );
  }
}
