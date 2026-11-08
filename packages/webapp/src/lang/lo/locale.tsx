import type { FormatErrorParams } from 'yup';
import printValue from '../printValue';

export const locale = {
  mixed: {
    default: '${path} ບໍ່ຖືກຕ້ອງ',
    required: 'ຕ້ອງປ້ອນ ${path}',
    defined: 'ຕ້ອງກຳນົດ ${path}',
    oneOf: '${path} ຕ້ອງເປັນຄ່າໃດໜຶ່ງຕໍ່ໄປນີ້: ${values}',
    notOneOf: '${path} ຕ້ອງບໍ່ເປັນຄ່າຕໍ່ໄປນີ້: ${values}',
    notType: ({ path, value }: FormatErrorParams) =>
      `${path} ມີປະເພດຂໍ້ມູນບໍ່ຖືກຕ້ອງ. ຄ່າທີ່ໄດ້ຮັບ: ${printValue(value, true)}`,
  },
  string: {
    length: '${path} ຕ້ອງມີ ${length} ຕົວອັກສອນ',
    min: '${path} ຕ້ອງມີຢ່າງໜ້ອຍ ${min} ຕົວອັກສອນ',
    max: '${path} ຕ້ອງບໍ່ເກີນ ${max} ຕົວອັກສອນ',
    matches: '${path} ຕ້ອງກົງກັບຮູບແບບ: "${regex}"',
    email: '${path} ຕ້ອງເປັນອີເມວທີ່ຖືກຕ້ອງ',
    url: '${path} ຕ້ອງເປັນ URL ທີ່ຖືກຕ້ອງ',
    trim: '${path} ຕ້ອງບໍ່ມີຊ່ອງວ່າງທີ່ຕົ້ນ ຫຼື ທ້າຍ',
    lowercase: '${path} ຕ້ອງເປັນຕົວພິມນ້ອຍ',
    uppercase: '${path} ຕ້ອງເປັນຕົວພິມໃຫຍ່',
  },
  number: {
    min: '${path} ຕ້ອງໃຫຍ່ກວ່າ ຫຼື ເທົ່າກັບ ${min}',
    max: '${path} ຕ້ອງນ້ອຍກວ່າ ຫຼື ເທົ່າກັບ ${max}',
    lessThan: '${path} ຕ້ອງນ້ອຍກວ່າ ${less}',
    moreThan: '${path} ຕ້ອງໃຫຍ່ກວ່າ ${more}',
    notEqual: '${path} ຕ້ອງບໍ່ເທົ່າກັບ ${notEqual}',
    positive: '${path} ຕ້ອງເປັນຈຳນວນບວກ',
    negative: '${path} ຕ້ອງເປັນຈຳນວນລົບ',
    integer: '${path} ຕ້ອງເປັນຈຳນວນຖ້ວນ',
  },
  date: {
    min: '${path} ຕ້ອງຫຼັງ ${min}',
    max: '${path} ຕ້ອງກ່ອນ ${max}',
  },
  object: {
    noUnknown: '${path} ຕ້ອງບໍ່ມີຊ່ອງຂໍ້ມູນນອກເໜືອຈາກທີ່ກຳນົດ',
  },
  array: {
    min: '${path} ຕ້ອງມີຢ່າງໜ້ອຍ ${min} ລາຍການ',
    max: '${path} ຕ້ອງມີບໍ່ເກີນ ${max} ລາຍການ',
  },
};
