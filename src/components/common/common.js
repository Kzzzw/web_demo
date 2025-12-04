export const commonDescriptionsBinds = {
  size: 'small',
  column: 1,
  colon: false,
  'label-style': { flexShrink: 0, padding: '0 0 16px 0', width: '102px', justifyContent: 'flex-end', color: '#686f82' },
  'content-style': {
    flex: 1,
    overflow: 'hidden',
    flexWrap: 'wrap',
    padding: '0 0 0 34px',
    color: '#32374a',
    wordBreak: 'break-all',
  },
};

export const commonTagBinds = {
  color: '#e6f0ff',
  style: {
    color: '#3562e7',
    marginBottom: '8px',
    maxWidth: '100%',
    padding: '0 8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }
};

export const commonForm = {
  getFormBinds: ({ labelWidth: width } = { labelWidth: '5em' }) => ({
    colon: false,
    autocomplete: 'off',
    labelCol: { style: { boxSizing: 'content-box', paddingRight: '17px', width } },
  }),
};

const inputTrigger = ['blur', 'change'];
const defCommonInput = {
  getRequiredRule: (name, msg) => [{
    required: true,
    trigger: ['blur', 'change'],
    message: msg ? msg : `请输入${ name ?? '' }`
  }],
  getMaxLengthRule: (name, max) => [{
    max,
    message: `${ name }不能超过${ max }个字符`,
    trigger: inputTrigger,
  }],
  getBlankRule: name => [{
    validator(_, val, cb) {
      if (/\s/.test(val))
        return cb(new Error(`${ name }中不能包含空格或空白字符`));
      else
        return cb();
    },
    trigger: inputTrigger,
  }],
  getPhoneRule: name => [{
    validator(_, val, cb) {
      // 手机号
      const reg = /^(?:(?:\+|00)86)?1[3-9]\d{9}$/;
      if (val && val.length && !reg.test(val))
        return cb(new Error(`请输入正确的${ name || '手机号码' }`));
      else
        return cb();
    },
    trigger: inputTrigger,
  }],
  getIpRule: name => [{
    validator(_, val, cb) {
      // ip地址 v4 v6
      const reg = /^((25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))((\/(([12]?\d)|(3[0-2])))|(-((25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))))?$|^(?:[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4}){7})(\/\d{1,3})?$/;
      if (val && val.length && !reg.test(val))
        return cb(new Error(`请输入正确的${ name || 'ip地址' }`));
      else
        return cb();
    },
    trigger: inputTrigger,
  }],
  getPortRule: name => [{
    // 端口 范围0-65535
    validator(_, val, cb) {
      const reg = /^(0|[1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/;
      if (val && val.length && !reg.test(val))
        return cb(new Error(`${ name || '端口号' }格式错误，范围 0 ~ 65535`));
      else
        return cb();
    },
    trigger: inputTrigger,
  }],
  getEmailRule: name => [{
    validator(_, val, cb) {
      const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (val && val.length && !reg.test(val))
        return cb(new Error(`请输入正确的${ name || '电子邮箱' }`));
      else
        return cb();
    },
    trigger: inputTrigger,
  }],
  getContactRule: name => [{
    validator(_, val, cb) {
      const landlineReg = /^0\d{2,3}-\d{6,8}$/; // 座机
      const phoneReg = /^(?:(?:\+|00)86)?1[3-9]\d{9}$/; // 手机
      if (val && val.length && !landlineReg.test(val) && !phoneReg.test(val))
        return cb(new Error(`请输入正确的${ name || '联系方式' }`));
      else
        return cb();
    },
    trigger: inputTrigger,
  }],

};
const defCommonOpts = () => ({
  name: '',
  required: true, // 默认不能为空
  maxLength: Infinity, // 默认字数不限
  allowBlank: false, // 默认不允许空格
  isCheckPhone: false, // 默认不校验证手机
  isCheckIp: false, // 默认不校验证ip地址
  isCheckPort: false, // 默认不校验证端口
  isCheckEmail: false, // 默认不校验邮箱
  isCheckConcat: false, // 默认不校验联系方式
});
export const commonInput = {
  ...defCommonInput,
  getRules(opts = defCommonOpts()) {
    const {
      name: _name,
      required,
      maxLength,
      allowBlank,
      isCheckPhone,
      isCheckIp,
      isCheckPort,
      isCheckEmail,
      isCheckConcat,
    } = {
      ...defCommonOpts(),
      ...opts,
    };
    const name = [null, undefined, ''].includes(_name) ? '该字段' : _name;
    return [
      ...(required ? defCommonInput.getRequiredRule(name) : []),
      ...(maxLength < Infinity ? defCommonInput.getMaxLengthRule(name, maxLength) : []),
      ...(!allowBlank ? defCommonInput.getBlankRule(name) : []),
      ...(isCheckPhone ? defCommonInput.getPhoneRule(name) : []),
      ...(isCheckIp ? defCommonInput.getIpRule(name) : []),
      ...(isCheckPort ? defCommonInput.getPortRule(name) : []),
      ...(isCheckEmail ? defCommonInput.getEmailRule(name) : []),
      ...(isCheckConcat ? defCommonInput.getContactRule(name) : []),
    ];
  },
};
