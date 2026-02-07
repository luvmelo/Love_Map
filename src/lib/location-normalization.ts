export const COUNTRY_MAPPINGS: Record<string, string> = {
    // North America
    '美国': 'United States',
    'USA': 'United States',
    'US': 'United States',
    '加拿大': 'Canada',
    '墨西哥': 'Mexico',

    // Asia
    '中国': 'China',
    '日本': 'Japan',
    '韩国': 'South Korea',
    '朝鲜': 'North Korea',
    '泰国': 'Thailand',
    '越南': 'Vietnam',
    '新加坡': 'Singapore',
    '马来西亚': 'Malaysia',
    '印度尼西亚': 'Indonesia',
    '菲律宾': 'Philippines',
    '印度': 'India',
    '香港': 'Hong Kong',
    '澳门': 'Macau',
    '台湾': 'Taiwan',

    // Europe
    '英国': 'United Kingdom',
    'UK': 'United Kingdom',
    'Great Britain': 'United Kingdom',
    '法国': 'France',
    '德国': 'Germany',
    '意大利': 'Italy',
    '西班牙': 'Spain',
    '葡萄牙': 'Portugal',
    '荷兰': 'Netherlands',
    '比利时': 'Belgium',
    '瑞士': 'Switzerland',
    '瑞典': 'Sweden',
    '挪威': 'Norway',
    '芬兰': 'Finland',
    '丹麦': 'Denmark',
    '爱尔兰': 'Ireland',
    '俄罗斯': 'Russia',
    '希腊': 'Greece',
    '土耳其': 'Turkey',

    // Oceania
    '澳大利亚': 'Australia',
    '新西兰': 'New Zealand',
};

export const CITY_MAPPINGS: Record<string, string> = {
    // US
    '波士顿': 'Boston',
    '纽约': 'New York',
    '旧金山': 'San Francisco',
    '洛杉矶': 'Los Angeles',
    '芝加哥': 'Chicago',
    '西雅图': 'Seattle',
    '华盛顿': 'Washington',
    '拉斯维加斯': 'Las Vegas',
    '迈阿密': 'Miami',
    '休斯顿': 'Houston',

    // China
    '北京': 'Beijing',
    '上海': 'Shanghai',
    '广州': 'Guangzhou',
    '深圳': 'Shenzhen',
    '成都': 'Chengdu',
    '杭州': 'Hangzhou',
    '西安': 'Xi\'an',
    '南京': 'Nanjing',
    '武汉': 'Wuhan',
    '重庆': 'Chongqing',
    '香港': 'Hong Kong',
    '澳门': 'Macau',

    // Japan
    '东京': 'Tokyo',
    '大阪': 'Osaka',
    '京都': 'Kyoto',
    '横滨': 'Yokohama',
    '名古屋': 'Nagoya',
    '札幌': 'Sapporo',
    '福冈': 'Fukuoka',

    // Korea
    '首尔': 'Seoul',
    '釜山': 'Busan',
    '济州岛': 'Jeju',

    // Europe
    '伦敦': 'London',
    '巴黎': 'Paris',
    '柏林': 'Berlin',
    '罗马': 'Rome',
    '马德里': 'Madrid',
    '巴塞罗那': 'Barcelona',
    '阿姆斯特丹': 'Amsterdam',
    '米兰': 'Milan',
    '慕尼黑': 'Munich',
    '威尼斯': 'Venice',
    '佛罗伦萨': 'Florence',
    '日内瓦': 'Geneva',
    '苏黎世': 'Zurich',
    '维也纳': 'Vienna',
    '布拉格': 'Prague',
    '布达佩斯': 'Budapest',
    '雅典': 'Athens',
    '伊斯坦布尔': 'Istanbul',
    '莫斯科': 'Moscow',

    // Others
    '悉尼': 'Sydney',
    '墨尔本': 'Melbourne',
    '多伦多': 'Toronto',
    '温哥华': 'Vancouver',
    '迪拜': 'Dubai',
    '新加坡': 'Singapore',
    '曼谷': 'Bangkok',
};

export function normalizeLocation(name: string, type: 'country' | 'city'): string {
    if (!name) return name;

    const mapping = type === 'country' ? COUNTRY_MAPPINGS : CITY_MAPPINGS;
    return mapping[name] || name;
}
