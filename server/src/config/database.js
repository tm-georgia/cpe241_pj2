import pg from "pg";
import { ENV } from "./env.js";

const { Pool } = pg;

let pool = null;
let useFallback = false;

// Pre-seeded Memory State matching seed data for offline fallback
const memoryDb = {
  customer: [
    { id: 1, name: "Somchai Prasert", nrc_no: "110370001", phone_no: "0812345678", address_line1: "Bangkok", address_line2: "Chatuchak District", date_of_birth: "1985-03-12", code: "C001" },
    { id: 2, name: "Suda Kanchana", nrc_no: "110370002", phone_no: "0823456789", address_line1: "Bangkok", address_line2: "Bang Kapi District", date_of_birth: "1990-07-25", code: "C002" },
    { id: 3, name: "Anan Chaiyaporn", nrc_no: "110370003", phone_no: "0834567890", address_line1: "Chiang Mai", address_line2: "Mueang Chiang Mai", date_of_birth: "1988-11-09", code: "C003" },
    { id: 4, name: "Narongrit Boonmee", nrc_no: "110370004", phone_no: "0845678901", address_line1: "Phuket", address_line2: "Kathu District", date_of_birth: "1992-01-18", code: "C004" },
    { id: 5, name: "Pimchanok Saelim", nrc_no: "110370005", phone_no: "0856789012", address_line1: "Bangkok", address_line2: "Lat Phrao District", date_of_birth: "1995-06-30", code: "C005" },
    { id: 6, name: "Thanawat Srisuk", nrc_no: "110370006", phone_no: "0867890123", address_line1: "Chonburi", address_line2: "Bang Saen", date_of_birth: "1987-09-14", code: "C006" },
    { id: 7, name: "Orathai Phongchai", nrc_no: "110370007", phone_no: "0878901234", address_line1: "Nakhon Ratchasima", address_line2: "Mueang Nakhon Ratchasima", date_of_birth: "1993-04-22", code: "C007" },
    { id: 8, name: "Kittipong Rattanakul", nrc_no: "110370008", phone_no: "0889012345", address_line1: "Bangkok", address_line2: "Sathon District", date_of_birth: "1989-12-05", code: "C008" },
    { id: 9, name: "Siriporn Meesuk", nrc_no: "110370009", phone_no: "0890123456", address_line1: "Ayutthaya", address_line2: "Bang Pa-in District", date_of_birth: "1996-08-17", code: "C009" },
    { id: 10, name: "Chaiwat Thongdee", nrc_no: "081245678", phone_no: "0811122233", address_line1: "Bangkok", address_line2: "Pathum Wan District", date_of_birth: "1984-02-28", code: "C010" },
    { id: 11, name: "Busaba Kaewmanee", nrc_no: "081245679", phone_no: "0822233344", address_line1: "Chiang Rai", address_line2: "Mueang Chiang Rai", date_of_birth: "1991-10-10", code: "C011" },
    { id: 12, name: "Prasong Yindee", nrc_no: "081245680", phone_no: "0833344455", address_line1: "Khon Kaen", address_line2: "Mueang Khon Kaen", date_of_birth: "1986-05-03", code: "C012" },
    { id: 13, name: "Nattapong Saetang", nrc_no: "081245681", phone_no: "0844455566", address_line1: "Bangkok", address_line2: "Huai Khwang District", date_of_birth: "1994-07-19", code: "C013" },
    { id: 14, name: "Wilaiwan Charoensuk", nrc_no: "081245682", phone_no: "0855566677", address_line1: "Surat Thani", address_line2: "Mueang Surat Thani", date_of_birth: "1988-03-27", code: "C014" },
    { id: 15, name: "Apisit Lertchai", nrc_no: "081245683", phone_no: "0866677788", address_line1: "Bangkok", address_line2: "Bang Na District", date_of_birth: "1992-11-11", code: "C015" },
    { id: 16, name: "Kanokwan Srichai", nrc_no: "081245684", phone_no: "0877788899", address_line1: "Nonthaburi", address_line2: "Pak Kret District", date_of_birth: "1997-12-02", code: "C016" },
    { id: 17, name: "Preecha Wongsa", nrc_no: "081245685", phone_no: "0888899900", address_line1: "Pathum Thani", address_line2: "Khlong Luang District", date_of_birth: "1983-09-06", code: "C017" },
    { id: 18, name: "Malee Charoen", nrc_no: "081245686", phone_no: "0899900011", address_line1: "Samut Prakan", address_line2: "Mueang Samut Prakan", date_of_birth: "1998-01-24", code: "C018" },
    { id: 19, name: "Worawut Tansakul", nrc_no: "081245687", phone_no: "0801012023", address_line1: "Rayong", address_line2: "Mueang Rayong", date_of_birth: "1990-04-13", code: "C019" },
    { id: 20, name: "Patcharin Kaewjai", nrc_no: "081245688", phone_no: "0812023034", address_line1: "Nakhon Pathom", address_line2: "Mueang Nakhon Pathom", date_of_birth: "1993-08-08", code: "C020" },
    { id: 21, name: "Teerapat Pholsiri", nrc_no: "081245689", phone_no: "0823034045", address_line1: "Udon Thani", address_line2: "Mueang Udon Thani", date_of_birth: "1989-05-29", code: "C021" },
    { id: 22, name: "Ratchanee Panyawat", nrc_no: "081245690", phone_no: "0834045056", address_line1: "Songkhla", address_line2: "Hat Yai District", date_of_birth: "1994-02-15", code: "C022" },
    { id: 23, name: "Sakchai Maneerat", nrc_no: "081245691", phone_no: "0845056067", address_line1: "Lampang", address_line2: "Mueang Lampang", date_of_birth: "1986-06-21", code: "C023" },
    { id: 24, name: "Duangkamol Sombat", nrc_no: "081245692", phone_no: "0856067078", address_line1: "Trang", address_line2: "Mueang Trang", date_of_birth: "1991-03-30", code: "C024" },
    { id: 25, name: "Narin Limsakul", nrc_no: "081245693", phone_no: "0867078089", address_line1: "Bangkok", address_line2: "Ratchathewi District", date_of_birth: "1996-10-05", code: "C025" },
    { id: 99, name: "Bank Treasury", nrc_no: "999999999", phone_no: "0200000000", address_line1: "Bangkok", address_line2: "Head Office", date_of_birth: "2000-01-01", code: "B000" }
  ],
  account: [
    { id: 0, account_no: "0000000000", open_date: "2018-01-01", status: "BANK_CASH", balance: 25000000.0, customer_id: 99 },

    { id: 1, account_no: "ACC001", open_date: "2020-01-15", status: "ACTIVE", balance: 186450.75, customer_id: 1 },
    { id: 2, account_no: "ACC002", open_date: "2021-03-22", status: "ACTIVE", balance: 254800.0, customer_id: 2 },
    { id: 3, account_no: "ACC003", open_date: "2019-07-10", status: "ACTIVE", balance: 48320.5, customer_id: 3 },
    { id: 4, account_no: "ACC004", open_date: "2022-05-18", status: "ACTIVE", balance: 194250.0, customer_id: 4 },
    { id: 5, account_no: "ACC005", open_date: "2023-02-01", status: "ACTIVE", balance: 26890.25, customer_id: 5 },
    { id: 6, account_no: "ACC006", open_date: "2020-11-30", status: "CLOSED", balance: 0.0, customer_id: 6 },
    { id: 7, account_no: "ACC007", open_date: "2021-08-09", status: "ACTIVE", balance: 82560.0, customer_id: 7 },
    { id: 8, account_no: "ACC008", open_date: "2018-12-12", status: "ACTIVE", balance: 61275.6, customer_id: 8 },
    { id: 9, account_no: "ACC009", open_date: "2022-09-27", status: "ACTIVE", balance: 32500.0, customer_id: 9 },
    { id: 10, account_no: "ACC010", open_date: "2020-06-14", status: "ACTIVE", balance: 71340.9, customer_id: 10 },
    { id: 11, account_no: "ACC011", open_date: "2019-04-03", status: "ACTIVE", balance: 103750.0, customer_id: 11 },
    { id: 12, account_no: "ACC012", open_date: "2021-10-21", status: "ACTIVE", balance: 68125.45, customer_id: 12 },
    { id: 13, account_no: "ACC013", open_date: "2023-01-11", status: "ACTIVE", balance: 435900.0, customer_id: 13 },
    { id: 14, account_no: "ACC014", open_date: "2022-07-19", status: "ACTIVE", balance: 227600.75, customer_id: 14 },
    { id: 15, account_no: "ACC015", open_date: "2020-03-05", status: "ACTIVE", balance: 15800.0, customer_id: 15 },
    { id: 16, account_no: "ACC016", open_date: "2023-06-09", status: "ACTIVE", balance: 52400.0, customer_id: 16 },
    { id: 17, account_no: "ACC017", open_date: "2021-01-28", status: "ACTIVE", balance: 378900.0, customer_id: 17 },
    { id: 18, account_no: "ACC018", open_date: "2024-02-16", status: "ACTIVE", balance: 22150.0, customer_id: 18 },
    { id: 19, account_no: "ACC019", open_date: "2020-09-07", status: "ACTIVE", balance: 146700.0, customer_id: 19 },
    { id: 20, account_no: "ACC020", open_date: "2022-11-25", status: "ACTIVE", balance: 90425.35, customer_id: 20 },
    { id: 21, account_no: "ACC021", open_date: "2019-10-04", status: "ACTIVE", balance: 112300.0, customer_id: 21 },
    { id: 22, account_no: "ACC022", open_date: "2021-12-19", status: "ACTIVE", balance: 76050.0, customer_id: 22 },
    { id: 23, account_no: "ACC023", open_date: "2022-04-11", status: "ACTIVE", balance: 33500.0, customer_id: 23 },
    { id: 24, account_no: "ACC024", open_date: "2023-09-15", status: "ACTIVE", balance: 58600.0, customer_id: 24 },
    { id: 25, account_no: "ACC025", open_date: "2024-01-20", status: "ACTIVE", balance: 41875.0, customer_id: 25 },

    { id: 99, account_no: "9999999999", open_date: "2018-01-01", status: "BANK_REVENUE", balance: 5000000.0, customer_id: 99 }
  ],
  charge_item: [
   { id: 1, charge_type: "Account Opening Fee", charge_amount: 50, description: "One-time fee for account opening", code: "CHG001" },
    { id: 2, charge_type: "Monthly Service Fee", charge_amount: 40, description: "Monthly account service fee", code: "CHG002" },
    { id: 3, charge_type: "ATM Card Annual Fee", charge_amount: 100, description: "Annual debit card maintenance fee", code: "CHG003" },
    { id: 4, charge_type: "Interbank Transfer Fee", charge_amount: 25, description: "External transfer", code: "CHG004" },
    { id: 5, charge_type: "Loan Processing Fee", charge_amount: 500, description: "Loan application", code: "CHG005" },
    { id: 6, charge_type: "Document Fee", charge_amount: 80, description: "Statement request", code: "CHG006" },
    { id: 7, charge_type: "SMS Alert Fee", charge_amount: 20, description: "SMS service", code: "CHG007" },
    { id: 8, charge_type: "Late Payment Fee", charge_amount: 300, description: "Late loan charge", code: "CHG008" }
  ],
  account_charge: [
    { id: 1, date: "2026-01-02", account_id: 1, charge_id: 1, code: "AC001" },
    { id: 2, date: "2026-01-03", account_id: 2, charge_id: 2, code: "AC002" },
    { id: 3, date: "2026-01-04", account_id: 3, charge_id: 3, code: "AC003" },
    { id: 4, date: "2026-01-05", account_id: 4, charge_id: 4, code: "AC004" },
    { id: 5, date: "2026-01-06", account_id: 5, charge_id: 1, code: "AC005" },
    { id: 6, date: "2026-01-07", account_id: 6, charge_id: 2, code: "AC006" },
    { id: 7, date: "2026-01-08", account_id: 7, charge_id: 3, code: "AC007" },
    { id: 8, date: "2026-01-09", account_id: 8, charge_id: 4, code: "AC008" },
    { id: 9, date: "2026-01-10", account_id: 9, charge_id: 1, code: "AC009" },
    { id: 10, date: "2026-01-11", account_id: 10, charge_id: 2, code: "AC010" },
    { id: 11, date: "2026-01-12", account_id: 11, charge_id: 3, code: "AC011" },
    { id: 12, date: "2026-01-13", account_id: 12, charge_id: 4, code: "AC012" },
    { id: 13, date: "2026-01-14", account_id: 13, charge_id: 1, code: "AC013" },
    { id: 14, date: "2026-01-15", account_id: 14, charge_id: 2, code: "AC014" },
    { id: 15, date: "2026-01-16", account_id: 15, charge_id: 3, code: "AC015" },
    { id: 16, date: "2026-01-17", account_id: 16, charge_id: 4, code: "AC016" },
    { id: 17, date: "2026-01-18", account_id: 17, charge_id: 1, code: "AC017" },
    { id: 18, date: "2026-01-19", account_id: 18, charge_id: 2, code: "AC018" },
    { id: 19, date: "2026-01-20", account_id: 19, charge_id: 3, code: "AC019" },
    { id: 20, date: "2026-01-21", account_id: 20, charge_id: 4, code: "AC020" },
    { id: 21, date: "2026-01-22", account_id: 21, charge_id: 1, code: "AC021" },
    { id: 22, date: "2026-01-23", account_id: 22, charge_id: 2, code: "AC022" },
    { id: 23, date: "2026-01-24", account_id: 23, charge_id: 3, code: "AC023" },
    { id: 24, date: "2026-01-25", account_id: 24, charge_id: 4, code: "AC024" },
    { id: 25, date: "2026-01-26", account_id: 25, charge_id: 1, code: "AC025" }
  ],
  account_charge_line_item: [
    { id: 1, account_id: 1, description: "Account fee charged on account 1200000001", account_charge_id: 1, date: "2026-01-02" },
    { id: 2, account_id: 99, description: "Bank received account fee for account 1200000001", account_charge_id: 1, date: "2026-01-02" },

    { id: 3, account_id: 2, description: "Account fee charged on account 1200000002", account_charge_id: 2, date: "2026-01-03" },
    { id: 4, account_id: 99, description: "Bank received account fee for account 1200000002", account_charge_id: 2, date: "2026-01-03" },

    { id: 5, account_id: 3, description: "Account fee charged on account 1200000003", account_charge_id: 3, date: "2026-01-04" },
    { id: 6, account_id: 99, description: "Bank received account fee for account 1200000003", account_charge_id: 3, date: "2026-01-04" },

    { id: 7, account_id: 4, description: "Account fee charged on account 1200000004", account_charge_id: 4, date: "2026-01-05" },
    { id: 8, account_id: 99, description: "Bank received account fee for account 1200000004", account_charge_id: 4, date: "2026-01-05" },

    { id: 9, account_id: 5, description: "Account fee charged on account 1200000005", account_charge_id: 5, date: "2026-01-06" },
    { id: 10, account_id: 99, description: "Bank received account fee for account 1200000005", account_charge_id: 5, date: "2026-01-06" },

    { id: 11, account_id: 6, description: "Account fee charged on account 1200000006", account_charge_id: 6, date: "2026-01-07" },
    { id: 12, account_id: 99, description: "Bank received account fee for account 1200000006", account_charge_id: 6, date: "2026-01-07" },

    { id: 13, account_id: 7, description: "Account fee charged on account 1200000007", account_charge_id: 7, date: "2026-01-08" },
    { id: 14, account_id: 99, description: "Bank received account fee for account 1200000007", account_charge_id: 7, date: "2026-01-08" },

    { id: 15, account_id: 8, description: "Account fee charged on account 1200000008", account_charge_id: 8, date: "2026-01-09" },
    { id: 16, account_id: 99, description: "Bank received account fee for account 1200000008", account_charge_id: 8, date: "2026-01-09" },

    { id: 17, account_id: 9, description: "Account fee charged on account 1200000009", account_charge_id: 9, date: "2026-01-10" },
    { id: 18, account_id: 99, description: "Bank received account fee for account 1200000009", account_charge_id: 9, date: "2026-01-10" },

    { id: 19, account_id: 10, description: "Account fee charged on account 1200000010", account_charge_id: 10, date: "2026-01-11" },
    { id: 20, account_id: 99, description: "Bank received account fee for account 1200000010", account_charge_id: 10, date: "2026-01-11" },

    { id: 21, account_id: 11, description: "Account fee charged on account 1200000011", account_charge_id: 11, date: "2026-01-12" },
    { id: 22, account_id: 99, description: "Bank received account fee for account 1200000011", account_charge_id: 11, date: "2026-01-12" },

    { id: 23, account_id: 12, description: "Account fee charged on account 1200000012", account_charge_id: 12, date: "2026-01-13" },
    { id: 24, account_id: 99, description: "Bank received account fee for account 1200000012", account_charge_id: 12, date: "2026-01-13" },

    { id: 25, account_id: 13, description: "Account fee charged on account 1200000013", account_charge_id: 13, date: "2026-01-14" },
    { id: 26, account_id: 99, description: "Bank received account fee for account 1200000013", account_charge_id: 13, date: "2026-01-14" },

    { id: 27, account_id: 14, description: "Account fee charged on account 1200000014", account_charge_id: 14, date: "2026-01-15" },
    { id: 28, account_id: 99, description: "Bank received account fee for account 1200000014", account_charge_id: 14, date: "2026-01-15" },

    { id: 29, account_id: 15, description: "Account fee charged on account 1200000015", account_charge_id: 15, date: "2026-01-16" },
    { id: 30, account_id: 99, description: "Bank received account fee for account 1200000015", account_charge_id: 15, date: "2026-01-16" },

    { id: 31, account_id: 16, description: "Account fee charged on account 1200000016", account_charge_id: 16, date: "2026-01-17" },
    { id: 32, account_id: 99, description: "Bank received account fee for account 1200000016", account_charge_id: 16, date: "2026-01-17" },

    { id: 33, account_id: 17, description: "Account fee charged on account 1200000017", account_charge_id: 17, date: "2026-01-18" },
    { id: 34, account_id: 99, description: "Bank received account fee for account 1200000017", account_charge_id: 17, date: "2026-01-18" },

    { id: 35, account_id: 18, description: "Account fee charged on account 1200000018", account_charge_id: 18, date: "2026-01-19" },
    { id: 36, account_id: 99, description: "Bank received account fee for account 1200000018", account_charge_id: 18, date: "2026-01-19" },

    { id: 37, account_id: 19, description: "Account fee charged on account 1200000019", account_charge_id: 19, date: "2026-01-20" },
    { id: 38, account_id: 99, description: "Bank received account fee for account 1200000019", account_charge_id: 19, date: "2026-01-20" },

    { id: 39, account_id: 20, description: "Account fee charged on account 1200000020", account_charge_id: 20, date: "2026-01-21" },
    { id: 40, account_id: 99, description: "Bank received account fee for account 1200000020", account_charge_id: 20, date: "2026-01-21" },

    { id: 41, account_id: 21, description: "Account fee charged on account 1200000021", account_charge_id: 21, date: "2026-01-22" },
    { id: 42, account_id: 99, description: "Bank received account fee for account 1200000021", account_charge_id: 21, date: "2026-01-22" },

    { id: 43, account_id: 22, description: "Account fee charged on account 1200000022", account_charge_id: 22, date: "2026-01-23" },
    { id: 44, account_id: 99, description: "Bank received account fee for account 1200000022", account_charge_id: 22, date: "2026-01-23" },

    { id: 45, account_id: 23, description: "Account fee charged on account 1200000023", account_charge_id: 23, date: "2026-01-24" },
    { id: 46, account_id: 99, description: "Bank received account fee for account 1200000023", account_charge_id: 23, date: "2026-01-24" },

    { id: 47, account_id: 24, description: "Account fee charged on account 1200000024", account_charge_id: 24, date: "2026-01-25" },
    { id: 48, account_id: 99, description: "Bank received account fee for account 1200000024", account_charge_id: 24, date: "2026-01-25" },

    { id: 49, account_id: 25, description: "Account fee charged on account 1200000025", account_charge_id: 25, date: "2026-01-26" },
    { id: 50, account_id: 99, description: "Bank received account fee for account 1200000025", account_charge_id: 25, date: "2026-01-26" }
  ],
  loan_type: [
    { id: 1, type_name: "Personal Loan", default_interest_rate: 6.5, max_term: 36, max_loan_amount: 300000, code: "LT001" },
    { id: 2, type_name: "Car Loan", default_interest_rate: 4.25, max_term: 72, max_loan_amount: 1500000, code: "LT002" },
    { id: 3, type_name: "Home Loan", default_interest_rate: 3.85, max_term: 240, max_loan_amount: 8000000, code: "LT003" },
    { id: 4, type_name: "Education Loan", default_interest_rate: 3.5, max_term: 60, max_loan_amount: 500000, code: "LT004" },
    { id: 5, type_name: "Business Loan", default_interest_rate: 7.25, max_term: 84, max_loan_amount: 3000000, code: "LT005" },
    { id: 6, type_name: "Micro Loan", default_interest_rate: 5.75, max_term: 24, max_loan_amount: 100000, code: "LT006" },
    { id: 7, type_name: "Emergency Loan", default_interest_rate: 8.5, max_term: 12, max_loan_amount: 50000, code: "LT007" },
    { id: 8, type_name: "Agriculture Loan", default_interest_rate: 4.75, max_term: 60, max_loan_amount: 800000, code: "LT008" },
    { id: 9, type_name: "Renovation Loan", default_interest_rate: 5.25, max_term: 60, max_loan_amount: 700000, code: "LT009" },
    { id: 10, type_name: "Medical Loan", default_interest_rate: 4.95, max_term: 36, max_loan_amount: 400000, code: "LT010" }
  ],
  loan: [
    { id: 1, account_id: 1, interest_rate: 5, loan_amount: 20000, start_date: "2025-01-01", loan_term: 3, loan_status: "Active", loan_type_id: 1, code: "L001", customer_id: 1, outstanding_balance: 7000 },
    { id: 2, account_id: 2, interest_rate: 5, loan_amount: 15000, start_date: "2025-01-10", loan_term: 3, loan_status: "Paid", loan_type_id: 1, code: "L002", customer_id: 2, outstanding_balance: 0 },
    { id: 3, account_id: 3, interest_rate: 3, loan_amount: 100000, start_date: "2025-01-15", loan_term: 6, loan_status: "Active", loan_type_id: 2, code: "L003", customer_id: 3, outstanding_balance: 51500 },
    { id: 4, account_id: 4, interest_rate: 5, loan_amount: 18000, start_date: "2025-02-01", loan_term: 3, loan_status: "Active", loan_type_id: 1, code: "L004", customer_id: 4, outstanding_balance: 6300 },
    { id: 5, account_id: 5, interest_rate: 3, loan_amount: 80000, start_date: "2025-02-10", loan_term: 5, loan_status: "Active", loan_type_id: 2, code: "L005", customer_id: 5, outstanding_balance: 32960 },
    { id: 6, account_id: 6, interest_rate: 5, loan_amount: 12000, start_date: "2025-02-15", loan_term: 3, loan_status: "Active", loan_type_id: 1, code: "L006", customer_id: 6, outstanding_balance: 4200 },
    { id: 7, account_id: 7, interest_rate: 5, loan_amount: 10000, start_date: "2025-03-01", loan_term: 3, loan_status: "Active", loan_type_id: 1, code: "L007", customer_id: 7, outstanding_balance: 10500 },
    { id: 8, account_id: 8, interest_rate: 4, loan_amount: 300000, start_date: "2025-01-05", loan_term: 9, loan_status: "Active", loan_type_id: 3, code: "L008", customer_id: 8, outstanding_balance: 312000 },
    { id: 9, account_id: 9, interest_rate: 3, loan_amount: 40000, start_date: "2025-01-12", loan_term: 6, loan_status: "Active", loan_type_id: 4, code: "L009", customer_id: 9, outstanding_balance: 27467 },
    { id: 10, account_id: 10, interest_rate: 5, loan_amount: 120000, start_date: "2025-01-20", loan_term: 6, loan_status: "Active", loan_type_id: 5, code: "L010", customer_id: 10, outstanding_balance: 84000 },
    { id: 11, account_id: 11, interest_rate: 3, loan_amount: 8000, start_date: "2025-02-01", loan_term: 2, loan_status: "Active", loan_type_id: 6, code: "L011", customer_id: 11, outstanding_balance: 4120 },
    { id: 12, account_id: 12, interest_rate: 7, loan_amount: 4000, start_date: "2025-02-05", loan_term: 3, loan_status: "Active", loan_type_id: 7, code: "L012", customer_id: 12, outstanding_balance: 1427 },
    { id: 13, account_id: 13, interest_rate: 5, loan_amount: 90000, start_date: "2025-02-08", loan_term: 6, loan_status: "Active", loan_type_id: 8, code: "L013", customer_id: 13, outstanding_balance: 94500 },
    { id: 14, account_id: 14, interest_rate: 5, loan_amount: 150000, start_date: "2025-02-12", loan_term: 9, loan_status: "Active", loan_type_id: 9, code: "L014", customer_id: 14, outstanding_balance: 157500 },
    { id: 15, account_id: 15, interest_rate: 6, loan_amount: 60000, start_date: "2025-02-18", loan_term: 5, loan_status: "Active", loan_type_id: 10, code: "L015", customer_id: 15, outstanding_balance: 63600 }
  ],
  loan_disbursement_line_item: [
    { id: 1, loan_id: 1, disbursement_amount: 20000, disbursement_date: "2025-01-01", code: "DBN01" },
    { id: 2, loan_id: 2, disbursement_amount: 8000, disbursement_date: "2025-01-10", code: "DBN02" },
    { id: 3, loan_id: 2, disbursement_amount: 7000, disbursement_date: "2025-01-12", code: "DBN03" },
    { id: 4, loan_id: 3, disbursement_amount: 40000, disbursement_date: "2025-01-15", code: "DBN04" },
    { id: 5, loan_id: 3, disbursement_amount: 30000, disbursement_date: "2025-01-17", code: "DBN05" },
    { id: 6, loan_id: 3, disbursement_amount: 30000, disbursement_date: "2025-01-20", code: "DBN06" },
    { id: 7, loan_id: 4, disbursement_amount: 18000, disbursement_date: "2025-02-01", code: "DBN07" },
    { id: 8, loan_id: 5, disbursement_amount: 20000, disbursement_date: "2025-02-10", code: "DBN08" },
    { id: 9, loan_id: 5, disbursement_amount: 20000, disbursement_date: "2025-02-12", code: "DBN09" },
    { id: 10, loan_id: 5, disbursement_amount: 40000, disbursement_date: "2025-02-15", code: "DBN10" },
    { id: 11, loan_id: 6, disbursement_amount: 12000, disbursement_date: "2025-02-15", code: "DBN11" },
    { id: 12, loan_id: 7, disbursement_amount: 2000, disbursement_date: "2025-03-01", code: "DBN12" },
    { id: 13, loan_id: 7, disbursement_amount: 4000, disbursement_date: "2025-03-02", code: "DBN13" },
    { id: 14, loan_id: 7, disbursement_amount: 4000, disbursement_date: "2025-03-03", code: "DBN14" },
    { id: 15, loan_id: 8, disbursement_amount: 150000, disbursement_date: "2025-01-05", code: "DBN15" },
    { id: 16, loan_id: 8, disbursement_amount: 150000, disbursement_date: "2025-01-10", code: "DBN16" },
    { id: 17, loan_id: 9, disbursement_amount: 40000, disbursement_date: "2025-01-12", code: "DBN17" },
    { id: 18, loan_id: 10, disbursement_amount: 60000, disbursement_date: "2025-01-20", code: "DBN18" },
    { id: 19, loan_id: 10, disbursement_amount: 60000, disbursement_date: "2025-01-25", code: "DBN19" },
    { id: 20, loan_id: 11, disbursement_amount: 8000, disbursement_date: "2025-02-01", code: "DBN20" },
    { id: 21, loan_id: 12, disbursement_amount: 4000, disbursement_date: "2025-02-05", code: "DBN21" },
    { id: 22, loan_id: 13, disbursement_amount: 45000, disbursement_date: "2025-02-08", code: "DBN22" },
    { id: 23, loan_id: 13, disbursement_amount: 45000, disbursement_date: "2025-02-12", code: "DBN23" },
    { id: 24, loan_id: 14, disbursement_amount: 75000, disbursement_date: "2025-02-12", code: "DBN24" },
    { id: 25, loan_id: 14, disbursement_amount: 75000, disbursement_date: "2025-02-18", code: "DBN25" },
    { id: 26, loan_id: 15, disbursement_amount: 30000, disbursement_date: "2025-02-18", code: "DBN26" },
    { id: 27, loan_id: 15, disbursement_amount: 30000, disbursement_date: "2025-02-22", code: "DBN27" }
  ],
  loan_schedule: [
    { id: 1, loan_id: 1, installment_no: 1, due_date: "2025-02-01", amount_due: 7000, status: "Paid", code: "SCH-001" },
    { id: 2, loan_id: 1, installment_no: 2, due_date: "2025-03-01", amount_due: 7000, status: "Paid", code: "SCH-002" },
    { id: 3, loan_id: 1, installment_no: 3, due_date: "2025-04-01", amount_due: 7000, status: "Unpaid", code: "SCH-003" },
    { id: 4, loan_id: 2, installment_no: 1, due_date: "2025-02-10", amount_due: 5250, status: "Paid", code: "SCH-004" },
    { id: 5, loan_id: 2, installment_no: 2, due_date: "2025-03-10", amount_due: 5250, status: "Paid", code: "SCH-005" },
    { id: 6, loan_id: 2, installment_no: 3, due_date: "2025-04-10", amount_due: 5250, status: "Paid", code: "SCH-006" },
    { id: 7, loan_id: 3, installment_no: 1, due_date: "2025-02-15", amount_due: 17166.67, status: "Paid", code: "SCH-007" },
    { id: 8, loan_id: 3, installment_no: 2, due_date: "2025-03-15", amount_due: 17166.67, status: "Paid", code: "SCH-008" },
    { id: 9, loan_id: 3, installment_no: 3, due_date: "2025-04-15", amount_due: 17166.67, status: "Paid", code: "SCH-009" },
    { id: 10, loan_id: 3, installment_no: 4, due_date: "2025-05-15", amount_due: 17166.67, status: "Unpaid", code: "SCH-010" },
    { id: 11, loan_id: 3, installment_no: 5, due_date: "2025-06-15", amount_due: 17166.67, status: "Unpaid", code: "SCH-011" },
    { id: 12, loan_id: 3, installment_no: 6, due_date: "2025-07-15", amount_due: 17166.65, status: "Unpaid", code: "SCH-012" },
    { id: 13, loan_id: 4, installment_no: 1, due_date: "2025-03-01", amount_due: 6300, status: "Paid", code: "SCH-013" },
    { id: 14, loan_id: 4, installment_no: 2, due_date: "2025-04-01", amount_due: 6300, status: "Paid", code: "SCH-014" },
    { id: 15, loan_id: 4, installment_no: 3, due_date: "2025-05-01", amount_due: 6300, status: "Unpaid", code: "SCH-015" },
    { id: 16, loan_id: 5, installment_no: 1, due_date: "2025-03-10", amount_due: 16480, status: "Paid", code: "SCH-016" },
    { id: 17, loan_id: 5, installment_no: 2, due_date: "2025-04-10", amount_due: 16480, status: "Paid", code: "SCH-017" },
    { id: 18, loan_id: 5, installment_no: 3, due_date: "2025-05-10", amount_due: 16480, status: "Paid", code: "SCH-018" },
    { id: 19, loan_id: 5, installment_no: 4, due_date: "2025-06-10", amount_due: 16480, status: "Unpaid", code: "SCH-019" },
    { id: 20, loan_id: 5, installment_no: 5, due_date: "2025-07-10", amount_due: 16480, status: "Unpaid", code: "SCH-020" },
    { id: 21, loan_id: 6, installment_no: 1, due_date: "2025-03-15", amount_due: 4200, status: "Paid", code: "SCH-021" },
    { id: 22, loan_id: 6, installment_no: 2, due_date: "2025-04-15", amount_due: 4200, status: "Paid", code: "SCH-022" },
    { id: 23, loan_id: 6, installment_no: 3, due_date: "2025-05-15", amount_due: 4200, status: "Unpaid", code: "SCH-023" },
    { id: 24, loan_id: 7, installment_no: 1, due_date: "2025-04-01", amount_due: 3500, status: "Unpaid", code: "SCH-024" },
    { id: 25, loan_id: 7, installment_no: 2, due_date: "2025-05-01", amount_due: 3500, status: "Unpaid", code: "SCH-025" },
    { id: 26, loan_id: 7, installment_no: 3, due_date: "2025-06-01", amount_due: 3500, status: "Unpaid", code: "SCH-026" },
    { id: 27, loan_id: 8, installment_no: 1, due_date: "2025-02-05", amount_due: 34666.67, status: "Unpaid", code: "SCH-027" },
    { id: 28, loan_id: 8, installment_no: 2, due_date: "2025-03-05", amount_due: 34666.67, status: "Unpaid", code: "SCH-028" },
    { id: 29, loan_id: 8, installment_no: 3, due_date: "2025-04-05", amount_due: 34666.67, status: "Unpaid", code: "SCH-029" },
    { id: 30, loan_id: 8, installment_no: 4, due_date: "2025-05-05", amount_due: 34666.67, status: "Unpaid", code: "SCH-030" },
    { id: 31, loan_id: 8, installment_no: 5, due_date: "2025-06-05", amount_due: 34666.67, status: "Unpaid", code: "SCH-031" },
    { id: 32, loan_id: 8, installment_no: 6, due_date: "2025-07-05", amount_due: 34666.67, status: "Unpaid", code: "SCH-032" },
    { id: 33, loan_id: 8, installment_no: 7, due_date: "2025-08-05", amount_due: 34666.67, status: "Unpaid", code: "SCH-033" },
    { id: 34, loan_id: 8, installment_no: 8, due_date: "2025-09-05", amount_due: 34666.67, status: "Unpaid", code: "SCH-034" },
    { id: 35, loan_id: 8, installment_no: 9, due_date: "2025-10-05", amount_due: 34666.64, status: "Unpaid", code: "SCH-035" },
    { id: 36, loan_id: 9, installment_no: 1, due_date: "2025-02-12", amount_due: 6866.67, status: "Paid", code: "SCH-036" },
    { id: 37, loan_id: 9, installment_no: 2, due_date: "2025-03-12", amount_due: 6866.67, status: "Paid", code: "SCH-037" },
    { id: 38, loan_id: 9, installment_no: 3, due_date: "2025-04-12", amount_due: 6866.67, status: "Unpaid", code: "SCH-038" },
    { id: 39, loan_id: 9, installment_no: 4, due_date: "2025-05-12", amount_due: 6866.67, status: "Unpaid", code: "SCH-039" },
    { id: 40, loan_id: 9, installment_no: 5, due_date: "2025-06-12", amount_due: 6866.67, status: "Unpaid", code: "SCH-040" },
    { id: 41, loan_id: 9, installment_no: 6, due_date: "2025-07-12", amount_due: 6866.65, status: "Unpaid", code: "SCH-041" },
    { id: 42, loan_id: 10, installment_no: 1, due_date: "2025-02-20", amount_due: 21000, status: "Paid", code: "SCH-042" },
    { id: 43, loan_id: 10, installment_no: 2, due_date: "2025-03-20", amount_due: 21000, status: "Paid", code: "SCH-043" },
    { id: 44, loan_id: 10, installment_no: 3, due_date: "2025-04-20", amount_due: 21000, status: "Unpaid", code: "SCH-044" },
    { id: 45, loan_id: 10, installment_no: 4, due_date: "2025-05-20", amount_due: 21000, status: "Unpaid", code: "SCH-045" },
    { id: 46, loan_id: 10, installment_no: 5, due_date: "2025-06-20", amount_due: 21000, status: "Unpaid", code: "SCH-046" },
    { id: 47, loan_id: 10, installment_no: 6, due_date: "2025-07-20", amount_due: 21000, status: "Unpaid", code: "SCH-047" },
    { id: 48, loan_id: 11, installment_no: 1, due_date: "2025-03-01", amount_due: 4120, status: "Paid", code: "SCH-048" },
    { id: 49, loan_id: 11, installment_no: 2, due_date: "2025-04-01", amount_due: 4120, status: "Unpaid", code: "SCH-049" },
    { id: 50, loan_id: 12, installment_no: 1, due_date: "2025-03-05", amount_due: 1426.67, status: "Paid", code: "SCH-050" },
    { id: 51, loan_id: 12, installment_no: 2, due_date: "2025-04-05", amount_due: 1426.67, status: "Paid", code: "SCH-051" },
    { id: 52, loan_id: 12, installment_no: 3, due_date: "2025-05-05", amount_due: 1426.66, status: "Unpaid", code: "SCH-052" },
    { id: 53, loan_id: 13, installment_no: 1, due_date: "2025-03-08", amount_due: 15750, status: "Unpaid", code: "SCH-053" },
    { id: 54, loan_id: 13, installment_no: 2, due_date: "2025-04-08", amount_due: 15750, status: "Unpaid", code: "SCH-054" },
    { id: 55, loan_id: 13, installment_no: 3, due_date: "2025-05-08", amount_due: 15750, status: "Unpaid", code: "SCH-055" },
    { id: 56, loan_id: 13, installment_no: 4, due_date: "2025-06-08", amount_due: 15750, status: "Unpaid", code: "SCH-056" },
    { id: 57, loan_id: 13, installment_no: 5, due_date: "2025-07-08", amount_due: 15750, status: "Unpaid", code: "SCH-057" },
    { id: 58, loan_id: 13, installment_no: 6, due_date: "2025-08-08", amount_due: 15750, status: "Unpaid", code: "SCH-058" },
    { id: 59, loan_id: 14, installment_no: 1, due_date: "2025-03-12", amount_due: 17500, status: "Unpaid", code: "SCH-059" },
    { id: 60, loan_id: 14, installment_no: 2, due_date: "2025-04-12", amount_due: 17500, status: "Unpaid", code: "SCH-060" },
    { id: 61, loan_id: 14, installment_no: 3, due_date: "2025-05-12", amount_due: 17500, status: "Unpaid", code: "SCH-061" },
    { id: 62, loan_id: 14, installment_no: 4, due_date: "2025-06-12", amount_due: 17500, status: "Unpaid", code: "SCH-062" },
    { id: 63, loan_id: 14, installment_no: 5, due_date: "2025-07-12", amount_due: 17500, status: "Unpaid", code: "SCH-063" },
    { id: 64, loan_id: 14, installment_no: 6, due_date: "2025-08-12", amount_due: 17500, status: "Unpaid", code: "SCH-064" },
    { id: 65, loan_id: 14, installment_no: 7, due_date: "2025-09-12", amount_due: 17500, status: "Unpaid", code: "SCH-065" },
    { id: 66, loan_id: 14, installment_no: 8, due_date: "2025-10-12", amount_due: 17500, status: "Unpaid", code: "SCH-066" },
    { id: 67, loan_id: 14, installment_no: 9, due_date: "2025-11-12", amount_due: 17500, status: "Unpaid", code: "SCH-067" },
    { id: 68, loan_id: 15, installment_no: 1, due_date: "2025-03-18", amount_due: 12720, status: "Unpaid", code: "SCH-068" },
    { id: 69, loan_id: 15, installment_no: 2, due_date: "2025-04-18", amount_due: 12720, status: "Unpaid", code: "SCH-069" },
    { id: 70, loan_id: 15, installment_no: 3, due_date: "2025-05-18", amount_due: 12720, status: "Unpaid", code: "SCH-070" },
    { id: 71, loan_id: 15, installment_no: 4, due_date: "2025-06-18", amount_due: 12720, status: "Unpaid", code: "SCH-071" },
    { id: 72, loan_id: 15, installment_no: 5, due_date: "2025-07-18", amount_due: 12720, status: "Unpaid", code: "SCH-072" }
  ],
  loan_payment: [
    { id: 1, loan_id: 1, total_paid: 6750, outstanding_balance: 13334, payment_date: "2025-02-01", code: "LP1" },
    { id: 2, loan_id: 1, total_paid: 6750, outstanding_balance: 6667, payment_date: "2025-03-01", code: "LP2" },
    { id: 3, loan_id: 2, total_paid: 5062, outstanding_balance: 10000, payment_date: "2025-02-10", code: "LP3" },
    { id: 4, loan_id: 2, total_paid: 5062, outstanding_balance: 5000, payment_date: "2025-03-10", code: "LP4" },
    { id: 5, loan_id: 3, total_paid: 16917, outstanding_balance: 83333, payment_date: "2025-02-15", code: "LP5" },
    { id: 6, loan_id: 3, total_paid: 16917, outstanding_balance: 66666, payment_date: "2025-03-15", code: "LP6" },
    { id: 7, loan_id: 4, total_paid: 6075, outstanding_balance: 12000, payment_date: "2025-03-01", code: "LP7" },
    { id: 8, loan_id: 4, total_paid: 6075, outstanding_balance: 6000, payment_date: "2025-04-01", code: "LP8" },
    { id: 9, loan_id: 5, total_paid: 16200, outstanding_balance: 64000, payment_date: "2025-03-10", code: "LP9" },
    { id: 10, loan_id: 5, total_paid: 16200, outstanding_balance: 48000, payment_date: "2025-04-10", code: "LP10" },
    { id: 11, loan_id: 5, total_paid: 16200, outstanding_balance: 32000, payment_date: "2025-05-10", code: "LP11" },
    { id: 12, loan_id: 6, total_paid: 4050, outstanding_balance: 8000, payment_date: "2025-03-15", code: "LP12" },
    { id: 13, loan_id: 6, total_paid: 4050, outstanding_balance: 4000, payment_date: "2025-04-15", code: "LP13" },
    { id: 14, loan_id: 9, total_paid: 6767, outstanding_balance: 33333, payment_date: "2025-02-12", code: "LP14" },
    { id: 15, loan_id: 9, total_paid: 6767, outstanding_balance: 26666, payment_date: "2025-03-12", code: "LP15" },
    { id: 16, loan_id: 10, total_paid: 20500, outstanding_balance: 99500, payment_date: "2025-02-20", code: "LP16" },
    { id: 17, loan_id: 10, total_paid: 20500, outstanding_balance: 79000, payment_date: "2025-03-20", code: "LP17" },
    { id: 18, loan_id: 11, total_paid: 4020, outstanding_balance: 4000, payment_date: "2025-03-01", code: "LP18" },
    { id: 19, loan_id: 12, total_paid: 1357, outstanding_balance: 2666, payment_date: "2025-03-05", code: "LP19" },
    { id: 20, loan_id: 12, total_paid: 1357, outstanding_balance: 1333, payment_date: "2025-04-05", code: "LP20" }
  ],
  loan_payment_line_item: [
    { id: 1, loan_payment_id: 1, loan_schedule_id: 1, amount_paid: 6750, principal_amount: 6667, interest_amount: 83, applied_interest_rate: 5 },
    { id: 2, loan_payment_id: 1, loan_schedule_id: 2, amount_paid: 6750, principal_amount: 6667, interest_amount: 83, applied_interest_rate: 5 },
    { id: 3, loan_payment_id: 3, loan_schedule_id: 4, amount_paid: 5062, principal_amount: 5000, interest_amount: 62, applied_interest_rate: 5 },
    { id: 4, loan_payment_id: 4, loan_schedule_id: 5, amount_paid: 5062, principal_amount: 5000, interest_amount: 62, applied_interest_rate: 5 },
    { id: 5, loan_payment_id: 5, loan_schedule_id: 7, amount_paid: 16917, principal_amount: 16666, interest_amount: 250, applied_interest_rate: 3 },
    { id: 6, loan_payment_id: 6, loan_schedule_id: 8, amount_paid: 16917, principal_amount: 16666, interest_amount: 250, applied_interest_rate: 3 },
    { id: 7, loan_payment_id: 7, loan_schedule_id: 13, amount_paid: 6075, principal_amount: 6000, interest_amount: 75, applied_interest_rate: 5 },
    { id: 8, loan_payment_id: 8, loan_schedule_id: 14, amount_paid: 6075, principal_amount: 6000, interest_amount: 75, applied_interest_rate: 5 },
    { id: 9, loan_payment_id: 9, loan_schedule_id: 16, amount_paid: 16200, principal_amount: 16000, interest_amount: 200, applied_interest_rate: 3 },
    { id: 10, loan_payment_id: 10, loan_schedule_id: 17, amount_paid: 16200, principal_amount: 16000, interest_amount: 200, applied_interest_rate: 3 },
    { id: 11, loan_payment_id: 11, loan_schedule_id: 18, amount_paid: 16200, principal_amount: 16000, interest_amount: 200, applied_interest_rate: 3 },
    { id: 12, loan_payment_id: 12, loan_schedule_id: 21, amount_paid: 4050, principal_amount: 4000, interest_amount: 50, applied_interest_rate: 5 },
    { id: 13, loan_payment_id: 13, loan_schedule_id: 22, amount_paid: 4050, principal_amount: 4000, interest_amount: 50, applied_interest_rate: 5 },
    { id: 14, loan_payment_id: 14, loan_schedule_id: 43, amount_paid: 6767, principal_amount: 6667, interest_amount: 100, applied_interest_rate: 3 },
    { id: 15, loan_payment_id: 15, loan_schedule_id: 44, amount_paid: 6767, principal_amount: 6667, interest_amount: 100, applied_interest_rate: 3 },
    { id: 16, loan_payment_id: 16, loan_schedule_id: 49, amount_paid: 20500, principal_amount: 20000, interest_amount: 500, applied_interest_rate: 5 },
    { id: 17, loan_payment_id: 17, loan_schedule_id: 50, amount_paid: 20500, principal_amount: 20000, interest_amount: 500, applied_interest_rate: 5 },
    { id: 18, loan_payment_id: 18, loan_schedule_id: 55, amount_paid: 4020, principal_amount: 4000, interest_amount: 20, applied_interest_rate: 3 },
    { id: 19, loan_payment_id: 19, loan_schedule_id: 57, amount_paid: 1357, principal_amount: 1333, interest_amount: 23, applied_interest_rate: 7 },
    { id: 20, loan_payment_id: 20, loan_schedule_id: 58, amount_paid: 1357, principal_amount: 1333, interest_amount: 23, applied_interest_rate: 7 }
  ],
  entry_type: [
    { id: 1, code: "Debit", description: "Money debited/withdrawn from the account" },
    { id: 2, code: "Credit", description: "Money credited/deposited to the account" }
  ],
  transaction_type: [
    { id: 1, code: "Single Transfer", description: "Single transfer from owner to destination" },
    { id: 2, code: "Payroll Transfer", description: "Batch transfer to multiple employee accounts" },
    { id: 3, code: "Deposit", description: "Cash/Electronic deposit to account" },
    { id: 4, code: "Withdrawal", description: "Cash/Electronic withdrawal from account" },
    { id: 5, code: "ACCOUNT_CHARGE", description: "Bank charges account fees" },
    { id: 6, code: "LOAN_PAYMENT", description: "Payment from customer to bank" },
    { id: 7, code: "LOAN_DISBURSEMENT", description: "Bank disbursed loan to customer" }
  ],
  transaction_status: [
    { id: 1, code: "Pending", description: "Transaction is pending approval" },
    { id: 2, code: "Completed", description: "Transaction succeeded" },
    { id: 3, code: "Failed", description: "Transaction failed" }
  ],
  transfer_batch: [
    { id: 2, status: "Completed", batch_type: "Disbursement", batch_date: "2025-01-01", description: "Loan disbursements batch" },
    { id: 3, status: "Completed", batch_type: "Repayment", batch_date: "2025-02-01", description: "Loan repayment batch" },
    { id: 5, status: "Completed", batch_type: "Deposit", batch_date: "2025-02-14", description: "General Deposits batch" },
    { id: 6, status: "Completed", batch_type: "Withdrawal", batch_date: "2025-02-10", description: "General Withdrawals batch" }
  ],
  transaction_table: [
    { id: 1, amount: 15000, transaction_date: "2026-02-02", remark: "Cash deposit to account 1200000001", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0001" },
    { id: 2, amount: 25000, transaction_date: "2026-02-03", remark: "Cash deposit to account 1200000002", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0002" },
    { id: 3, amount: 8000, transaction_date: "2026-02-04", remark: "Cash deposit to account 1200000003", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0003" },
    { id: 4, amount: 12000, transaction_date: "2026-02-05", remark: "Cash deposit to account 1200000004", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0004" },
    { id: 5, amount: 5000, transaction_date: "2026-02-06", remark: "Cash deposit to account 1200000005", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0005" },
    { id: 6, amount: 7000, transaction_date: "2026-02-07", remark: "Cash deposit to account 1200000006", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0006" },
    { id: 7, amount: 9000, transaction_date: "2026-02-08", remark: "Cash deposit to account 1200000007", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0007" },
    { id: 8, amount: 11000, transaction_date: "2026-02-09", remark: "Cash deposit to account 1200000008", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0008" },
    { id: 9, amount: 6500, transaction_date: "2026-02-10", remark: "Cash deposit to account 1200000009", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0009" },
    { id: 10, amount: 14000, transaction_date: "2026-02-11", remark: "Cash deposit to account 1200000010", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0010" },
    { id: 11, amount: 10000, transaction_date: "2026-02-12", remark: "Cash deposit to account 1200000011", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0011" },
    { id: 12, amount: 7500, transaction_date: "2026-02-13", remark: "Cash deposit to account 1200000012", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0012" },
    { id: 13, amount: 18000, transaction_date: "2026-02-14", remark: "Cash deposit to account 1200000013", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0013" },
    { id: 14, amount: 13000, transaction_date: "2026-02-15", remark: "Cash deposit to account 1200000014", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0014" },
    { id: 15, amount: 4000, transaction_date: "2026-02-16", remark: "Cash deposit to account 1200000015", transaction_type_id: 5, batch_id: null, status_id: 2, transaction_code: "TXN0015" },
    { id: 16, amount: 3000, transaction_date: "2026-03-02", remark: "ATM withdrawal from account 1200000001", transaction_type_id: 6, batch_id: null, status_id: 2, transaction_code: "TXN0016" },
    { id: 17, amount: 4500, transaction_date: "2026-03-03", remark: "ATM withdrawal from account 1200000002", transaction_type_id: 6, batch_id: null, status_id: 2, transaction_code: "TXN0017" },
    { id: 18, amount: 2000, transaction_date: "2026-03-04", remark: "ATM withdrawal from account 1200000003", transaction_type_id: 6, batch_id: null, status_id: 2, transaction_code: "TXN0018" },
    { id: 19, amount: 5000, transaction_date: "2026-03-05", remark: "ATM withdrawal from account 1200000004", transaction_type_id: 6, batch_id: null, status_id: 2, transaction_code: "TXN0019" },
    { id: 20, amount: 1500, transaction_date: "2026-03-06", remark: "ATM withdrawal from account 1200000005", transaction_type_id: 6, batch_id: null, status_id: 2, transaction_code: "TXN0020" },
    { id: 21, amount: 2500, transaction_date: "2026-03-07", remark: "ATM withdrawal from account 1200000006", transaction_type_id: 6, batch_id: null, status_id: 2, transaction_code: "TXN0021" },
    { id: 22, amount: 3500, transaction_date: "2026-03-08", remark: "ATM withdrawal from account 1200000007", transaction_type_id: 6, batch_id: null, status_id: 2, transaction_code: "TXN0022" },
    { id: 23, amount: 4000, transaction_date: "2026-03-09", remark: "ATM withdrawal from account 1200000008", transaction_type_id: 6, batch_id: null, status_id: 2, transaction_code: "TXN0023" },
    { id: 24, amount: 2200, transaction_date: "2026-03-10", remark: "ATM withdrawal from account 1200000009", transaction_type_id: 6, batch_id: null, status_id: 2, transaction_code: "TXN0024" },
    { id: 25, amount: 2800, transaction_date: "2026-03-11", remark: "ATM withdrawal from account 1200000010", transaction_type_id: 6, batch_id: null, status_id: 2, transaction_code: "TXN0025" },
    { id: 26, amount: 7500, transaction_date: "2026-04-07", remark: "Transfer from 1200000001 to 1200000002", transaction_type_id: 4, batch_id: null, status_id: 2, transaction_code: "TXN0026" },
    { id: 27, amount: 4200, transaction_date: "2026-04-08", remark: "Transfer from 1200000003 to 1200000004", transaction_type_id: 4, batch_id: null, status_id: 2, transaction_code: "TXN0027" },
    { id: 28, amount: 3000, transaction_date: "2026-04-09", remark: "Transfer from 1200000005 to 1200000007", transaction_type_id: 4, batch_id: null, status_id: 2, transaction_code: "TXN0028" },
    { id: 29, amount: 5500, transaction_date: "2026-04-10", remark: "Transfer from 1200000008 to 1200000009", transaction_type_id: 4, batch_id: null, status_id: 2, transaction_code: "TXN0029" },
    { id: 30, amount: 6200, transaction_date: "2026-04-11", remark: "Transfer from 1200000010 to 1200000011", transaction_type_id: 4, batch_id: null, status_id: 2, transaction_code: "TXN0030" },
    { id: 31, amount: 8700, transaction_date: "2026-04-12", remark: "Transfer from 1200000012 to 1200000013", transaction_type_id: 4, batch_id: null, status_id: 2, transaction_code: "TXN0031" },
    { id: 32, amount: 4600, transaction_date: "2026-04-13", remark: "Transfer from 1200000014 to 1200000015", transaction_type_id: 4, batch_id: null, status_id: 2, transaction_code: "TXN0032" },
    { id: 33, amount: 9100, transaction_date: "2026-04-14", remark: "Transfer from 1200000016 to 1200000017", transaction_type_id: 4, batch_id: null, status_id: 2, transaction_code: "TXN0033" },
    { id: 34, amount: 2500, transaction_date: "2026-04-15", remark: "Transfer from 1200000018 to 1200000019", transaction_type_id: 4, batch_id: null, status_id: 2, transaction_code: "TXN0034" },
    { id: 35, amount: 7300, transaction_date: "2026-04-16", remark: "Transfer from 1200000020 to 1200000021", transaction_type_id: 4, batch_id: null, status_id: 2, transaction_code: "TXN0035" },
    { id: 36, amount: 152000, transaction_date: "2026-01-25", remark: "Payroll batch transfer", transaction_type_id: 7, batch_id: 1, status_id: 2, transaction_code: "TXN0036" },
    { id: 37, amount: 152000, transaction_date: "2026-02-25", remark: "Payroll batch transfer", transaction_type_id: 7, batch_id: 2, status_id: 2, transaction_code: "TXN0037" },
    { id: 38, amount: 120000, transaction_date: "2025-01-10", remark: "Loan disbursement for loan L001", transaction_type_id: 3, batch_id: null, status_id: 2, transaction_code: "TXN0038" },
    { id: 39, amount: 450000, transaction_date: "2024-09-15", remark: "Loan disbursement for loan L002", transaction_type_id: 3, batch_id: null, status_id: 2, transaction_code: "TXN0039" },
    { id: 40, amount: 180000, transaction_date: "2025-03-01", remark: "Loan disbursement for loan L003", transaction_type_id: 3, batch_id: null, status_id: 2, transaction_code: "TXN0040" },
    { id: 41, amount: 600000, transaction_date: "2024-06-20", remark: "Loan disbursement for loan L004", transaction_type_id: 3, batch_id: null, status_id: 2, transaction_code: "TXN0041" },
    { id: 42, amount: 40000, transaction_date: "2025-11-05", remark: "Loan disbursement for loan L005", transaction_type_id: 3, batch_id: null, status_id: 2, transaction_code: "TXN0042" },
    { id: 43, amount: 60000, transaction_date: "2025-08-12", remark: "Loan disbursement for loan L006", transaction_type_id: 3, batch_id: null, status_id: 2, transaction_code: "TXN0043" },
    { id: 44, amount: 1800000, transaction_date: "2023-04-01", remark: "Loan disbursement for loan L007", transaction_type_id: 3, batch_id: null, status_id: 2, transaction_code: "TXN0044" },
    { id: 45, amount: 90000, transaction_date: "2025-02-18", remark: "Loan disbursement for loan L008", transaction_type_id: 3, batch_id: null, status_id: 2, transaction_code: "TXN0045" },
    { id: 46, amount: 250000, transaction_date: "2024-12-10", remark: "Loan disbursement for loan L009", transaction_type_id: 3, batch_id: null, status_id: 2, transaction_code: "TXN0046" },
    { id: 47, amount: 300000, transaction_date: "2025-05-22", remark: "Loan disbursement for loan L010", transaction_type_id: 3, batch_id: null, status_id: 2, transaction_code: "TXN0047" },
    { id: 48, amount: 10650.0, transaction_date: "2025-02-10", remark: "Loan payment for loan L001", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0048" },
    { id: 49, amount: 10650.0, transaction_date: "2025-03-10", remark: "Loan payment for loan L001", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0049" },
    { id: 50, amount: 19546.88, transaction_date: "2024-10-15", remark: "Loan payment for loan L002", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0050" },
    { id: 51, amount: 19546.88, transaction_date: "2024-11-15", remark: "Loan payment for loan L002", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0051" },
    { id: 52, amount: 10350.0, transaction_date: "2025-04-01", remark: "Loan payment for loan L003", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0052" },
    { id: 53, amount: 10350.0, transaction_date: "2025-05-01", remark: "Loan payment for loan L003", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0053" },
    { id: 54, amount: 17875.0, transaction_date: "2024-07-20", remark: "Loan payment for loan L004", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0054" },
    { id: 55, amount: 17875.0, transaction_date: "2024-08-20", remark: "Loan payment for loan L004", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0055" },
    { id: 56, amount: 7233.33, transaction_date: "2025-12-05", remark: "Loan payment for loan L005", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0056" },
    { id: 57, amount: 7233.33, transaction_date: "2026-01-05", remark: "Loan payment for loan L005", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0057" },
    { id: 58, amount: 5287.5, transaction_date: "2025-09-12", remark: "Loan payment for loan L006", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0058" },
    { id: 59, amount: 5287.5, transaction_date: "2025-10-12", remark: "Loan payment for loan L006", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0059" },
    { id: 60, amount: 15577.5, transaction_date: "2023-05-01", remark: "Loan payment for loan L007", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0060" },
    { id: 61, amount: 15577.5, transaction_date: "2023-06-01", remark: "Loan payment for loan L007", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0061" },
    { id: 62, amount: 7987.5, transaction_date: "2025-03-18", remark: "Loan payment for loan L008", transaction_type_id: 2, batch_id: null, status_id: 2, transaction_code: "TXN0062" }
  ],
  transfer_line_item: [
    { id: 1, created_at: "2026-02-02", account_id: 0, amount: 15000, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 1 },
    { id: 2, created_at: "2026-02-02", account_id: 1, amount: 15000, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 1 },
    { id: 3, created_at: "2026-02-03", account_id: 0, amount: 25000, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 2 },
    { id: 4, created_at: "2026-02-03", account_id: 2, amount: 25000, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 2 },
    { id: 5, created_at: "2026-02-04", account_id: 0, amount: 8000, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 3 },
    { id: 6, created_at: "2026-02-04", account_id: 3, amount: 8000, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 3 },
    { id: 7, created_at: "2026-02-05", account_id: 0, amount: 12000, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 4 },
    { id: 8, created_at: "2026-02-05", account_id: 4, amount: 12000, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 4 },
    { id: 9, created_at: "2026-02-06", account_id: 0, amount: 5000, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 5 },
    { id: 10, created_at: "2026-02-06", account_id: 5, amount: 5000, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 5 },
    { id: 11, created_at: "2026-02-07", account_id: 0, amount: 7000, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 6 },
    { id: 12, created_at: "2026-02-07", account_id: 6, amount: 7000, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 6 },
    { id: 13, created_at: "2026-02-08", account_id: 0, amount: 9000, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 7 },
    { id: 14, created_at: "2026-02-08", account_id: 7, amount: 9000, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 7 },
    { id: 15, created_at: "2026-02-09", account_id: 0, amount: 11000, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 8 },
    { id: 16, created_at: "2026-02-09", account_id: 8, amount: 11000, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 8 },
    { id: 17, created_at: "2026-02-10", account_id: 0, amount: 6500, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 9 },
    { id: 18, created_at: "2026-02-10", account_id: 9, amount: 6500, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 9 },
    { id: 19, created_at: "2026-02-11", account_id: 0, amount: 14000, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 10 },
    { id: 20, created_at: "2026-02-11", account_id: 10, amount: 14000, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 10 },
    { id: 21, created_at: "2026-02-12", account_id: 0, amount: 10000, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 11 },
    { id: 22, created_at: "2026-02-12", account_id: 11, amount: 10000, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 11 },
    { id: 23, created_at: "2026-02-13", account_id: 0, amount: 7500, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 12 },
    { id: 24, created_at: "2026-02-13", account_id: 12, amount: 7500, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 12 },
    { id: 25, created_at: "2026-02-14", account_id: 0, amount: 18000, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 13 },
    { id: 26, created_at: "2026-02-14", account_id: 13, amount: 18000, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 13 },
    { id: 27, created_at: "2026-02-15", account_id: 0, amount: 13000, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 14 },
    { id: 28, created_at: "2026-02-15", account_id: 14, amount: 13000, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 14 },
    { id: 29, created_at: "2026-02-16", account_id: 0, amount: 4000, description: "Bank cash paid out to customer account", entry_type_id: 1, transaction_id: 15 },
    { id: 30, created_at: "2026-02-16", account_id: 15, amount: 4000, description: "Customer deposit credited", entry_type_id: 2, transaction_id: 15 },
    { id: 31, created_at: "2026-03-02", account_id: 1, amount: 3000, description: "Customer withdrawal debited", entry_type_id: 1, transaction_id: 16 },
    { id: 32, created_at: "2026-03-02", account_id: 0, amount: 3000, description: "Bank cash credited for withdrawal", entry_type_id: 2, transaction_id: 16 },
    { id: 33, created_at: "2026-03-03", account_id: 2, amount: 4500, description: "Customer withdrawal debited", entry_type_id: 1, transaction_id: 17 },
    { id: 34, created_at: "2026-03-03", account_id: 0, amount: 4500, description: "Bank cash credited for withdrawal", entry_type_id: 2, transaction_id: 17 },
    { id: 35, created_at: "2026-03-04", account_id: 3, amount: 2000, description: "Customer withdrawal debited", entry_type_id: 1, transaction_id: 18 },
    { id: 36, created_at: "2026-03-04", account_id: 0, amount: 2000, description: "Bank cash credited for withdrawal", entry_type_id: 2, transaction_id: 18 },
    { id: 37, created_at: "2026-03-05", account_id: 4, amount: 5000, description: "Customer withdrawal debited", entry_type_id: 1, transaction_id: 19 },
    { id: 38, created_at: "2026-03-05", account_id: 0, amount: 5000, description: "Bank cash credited for withdrawal", entry_type_id: 2, transaction_id: 19 },
    { id: 39, created_at: "2026-03-06", account_id: 5, amount: 1500, description: "Customer withdrawal debited", entry_type_id: 1, transaction_id: 20 },
    { id: 40, created_at: "2026-03-06", account_id: 0, amount: 1500, description: "Bank cash credited for withdrawal", entry_type_id: 2, transaction_id: 20 },
    { id: 41, created_at: "2026-03-07", account_id: 6, amount: 2500, description: "Customer withdrawal debited", entry_type_id: 1, transaction_id: 21 },
    { id: 42, created_at: "2026-03-07", account_id: 0, amount: 2500, description: "Bank cash credited for withdrawal", entry_type_id: 2, transaction_id: 21 },
    { id: 43, created_at: "2026-03-08", account_id: 7, amount: 3500, description: "Customer withdrawal debited", entry_type_id: 1, transaction_id: 22 },
    { id: 44, created_at: "2026-03-08", account_id: 0, amount: 3500, description: "Bank cash credited for withdrawal", entry_type_id: 2, transaction_id: 22 },
    { id: 45, created_at: "2026-03-09", account_id: 8, amount: 4000, description: "Customer withdrawal debited", entry_type_id: 1, transaction_id: 23 },
    { id: 46, created_at: "2026-03-09", account_id: 0, amount: 4000, description: "Bank cash credited for withdrawal", entry_type_id: 2, transaction_id: 23 },
    { id: 47, created_at: "2026-03-10", account_id: 9, amount: 2200, description: "Customer withdrawal debited", entry_type_id: 1, transaction_id: 24 },
    { id: 48, created_at: "2026-03-10", account_id: 0, amount: 2200, description: "Bank cash credited for withdrawal", entry_type_id: 2, transaction_id: 24 },
    { id: 49, created_at: "2026-03-11", account_id: 10, amount: 2800, description: "Customer withdrawal debited", entry_type_id: 1, transaction_id: 25 },
    { id: 50, created_at: "2026-03-11", account_id: 0, amount: 2800, description: "Bank cash credited for withdrawal", entry_type_id: 2, transaction_id: 25 },
    { id: 51, created_at: "2026-04-07", account_id: 1, amount: 7500, description: "Transfer debit", entry_type_id: 1, transaction_id: 26 },
    { id: 52, created_at: "2026-04-07", account_id: 2, amount: 7500, description: "Transfer credit", entry_type_id: 2, transaction_id: 26 },
    { id: 53, created_at: "2026-04-08", account_id: 3, amount: 4200, description: "Transfer debit", entry_type_id: 1, transaction_id: 27 },
    { id: 54, created_at: "2026-04-08", account_id: 4, amount: 4200, description: "Transfer credit", entry_type_id: 2, transaction_id: 27 },
    { id: 55, created_at: "2026-04-09", account_id: 5, amount: 3000, description: "Transfer debit", entry_type_id: 1, transaction_id: 28 },
    { id: 56, created_at: "2026-04-09", account_id: 7, amount: 3000, description: "Transfer credit", entry_type_id: 2, transaction_id: 28 },
    { id: 57, created_at: "2026-04-10", account_id: 8, amount: 5500, description: "Transfer debit", entry_type_id: 1, transaction_id: 29 },
    { id: 58, created_at: "2026-04-10", account_id: 9, amount: 5500, description: "Transfer credit", entry_type_id: 2, transaction_id: 29 },
    { id: 59, created_at: "2026-04-11", account_id: 10, amount: 6200, description: "Transfer debit", entry_type_id: 1, transaction_id: 30 },
    { id: 60, created_at: "2026-04-11", account_id: 11, amount: 6200, description: "Transfer credit", entry_type_id: 2, transaction_id: 30 },
    { id: 61, created_at: "2026-04-12", account_id: 12, amount: 8700, description: "Transfer debit", entry_type_id: 1, transaction_id: 31 },
    { id: 62, created_at: "2026-04-12", account_id: 13, amount: 8700, description: "Transfer credit", entry_type_id: 2, transaction_id: 31 },
    { id: 63, created_at: "2026-04-13", account_id: 14, amount: 4600, description: "Transfer debit", entry_type_id: 1, transaction_id: 32 },
    { id: 64, created_at: "2026-04-13", account_id: 15, amount: 4600, description: "Transfer credit", entry_type_id: 2, transaction_id: 32 },
    { id: 65, created_at: "2026-04-14", account_id: 16, amount: 9100, description: "Transfer debit", entry_type_id: 1, transaction_id: 33 },
    { id: 66, created_at: "2026-04-14", account_id: 17, amount: 9100, description: "Transfer credit", entry_type_id: 2, transaction_id: 33 },
    { id: 67, created_at: "2026-04-15", account_id: 18, amount: 2500, description: "Transfer debit", entry_type_id: 1, transaction_id: 34 },
    { id: 68, created_at: "2026-04-15", account_id: 19, amount: 2500, description: "Transfer credit", entry_type_id: 2, transaction_id: 34 },
    { id: 69, created_at: "2026-04-16", account_id: 20, amount: 7300, description: "Transfer debit", entry_type_id: 1, transaction_id: 35 },
    { id: 70, created_at: "2026-04-16", account_id: 21, amount: 7300, description: "Transfer credit", entry_type_id: 2, transaction_id: 35 },
    { id: 71, created_at: "2026-01-25", account_id: 0, amount: 152000, description: "Payroll funds released", entry_type_id: 1, transaction_id: 36 },
    { id: 72, created_at: "2026-01-25", account_id: 5, amount: 32000, description: "Salary credited", entry_type_id: 2, transaction_id: 36 },
    { id: 73, created_at: "2026-01-25", account_id: 9, amount: 28000, description: "Salary credited", entry_type_id: 2, transaction_id: 36 },
    { id: 74, created_at: "2026-01-25", account_id: 16, amount: 35000, description: "Salary credited", entry_type_id: 2, transaction_id: 36 },
    { id: 75, created_at: "2026-01-25", account_id: 18, amount: 30000, description: "Salary credited", entry_type_id: 2, transaction_id: 36 },
    { id: 76, created_at: "2026-01-25", account_id: 23, amount: 27000, description: "Salary credited", entry_type_id: 2, transaction_id: 36 },
    { id: 77, created_at: "2026-02-25", account_id: 0, amount: 152000, description: "Payroll funds released", entry_type_id: 1, transaction_id: 37 },
    { id: 78, created_at: "2026-02-25", account_id: 5, amount: 32000, description: "Salary credited", entry_type_id: 2, transaction_id: 37 },
    { id: 79, created_at: "2026-02-25", account_id: 9, amount: 28000, description: "Salary credited", entry_type_id: 2, transaction_id: 37 },
    { id: 80, created_at: "2026-02-25", account_id: 16, amount: 35000, description: "Salary credited", entry_type_id: 2, transaction_id: 37 },
    { id: 81, created_at: "2026-02-25", account_id: 18, amount: 30000, description: "Salary credited", entry_type_id: 2, transaction_id: 37 },
    { id: 82, created_at: "2026-02-25", account_id: 23, amount: 27000, description: "Salary credited", entry_type_id: 2, transaction_id: 37 },
    { id: 83, created_at: "2025-01-10", account_id: 0, amount: 120000, description: "Bank disbursed loan amount", entry_type_id: 1, transaction_id: 38 },
    { id: 84, created_at: "2025-01-10", account_id: 1, amount: 120000, description: "Loan amount credited", entry_type_id: 2, transaction_id: 38 },
    { id: 85, created_at: "2024-09-15", account_id: 0, amount: 450000, description: "Bank disbursed loan amount", entry_type_id: 1, transaction_id: 39 },
    { id: 86, created_at: "2024-09-15", account_id: 2, amount: 450000, description: "Loan amount credited", entry_type_id: 2, transaction_id: 39 },
    { id: 87, created_at: "2025-03-01", account_id: 0, amount: 180000, description: "Bank disbursed loan amount", entry_type_id: 1, transaction_id: 40 },
    { id: 88, created_at: "2025-03-01", account_id: 3, amount: 180000, description: "Loan amount credited", entry_type_id: 2, transaction_id: 40 },
    { id: 89, created_at: "2024-06-20", account_id: 0, amount: 600000, description: "Bank disbursed loan amount", entry_type_id: 1, transaction_id: 41 },
    { id: 90, created_at: "2024-06-20", account_id: 4, amount: 600000, description: "Loan amount credited", entry_type_id: 2, transaction_id: 41 },
    { id: 91, created_at: "2025-11-05", account_id: 0, amount: 40000, description: "Bank disbursed loan amount", entry_type_id: 1, transaction_id: 42 },
    { id: 92, created_at: "2025-11-05", account_id: 5, amount: 40000, description: "Loan amount credited", entry_type_id: 2, transaction_id: 42 },
    { id: 93, created_at: "2025-08-12", account_id: 0, amount: 60000, description: "Bank disbursed loan amount", entry_type_id: 1, transaction_id: 43 },
    { id: 94, created_at: "2025-08-12", account_id: 7, amount: 60000, description: "Loan amount credited", entry_type_id: 2, transaction_id: 43 },
    { id: 95, created_at: "2023-04-01", account_id: 0, amount: 1800000, description: "Bank disbursed loan amount", entry_type_id: 1, transaction_id: 44 },
    { id: 96, created_at: "2023-04-01", account_id: 8, amount: 1800000, description: "Loan amount credited", entry_type_id: 2, transaction_id: 44 },
    { id: 97, created_at: "2025-02-18", account_id: 0, amount: 90000, description: "Bank disbursed loan amount", entry_type_id: 1, transaction_id: 45 },
    { id: 98, created_at: "2025-02-18", account_id: 10, amount: 90000, description: "Loan amount credited", entry_type_id: 2, transaction_id: 45 },
    { id: 99, created_at: "2024-12-10", account_id: 0, amount: 250000, description: "Bank disbursed loan amount", entry_type_id: 1, transaction_id: 46 },
    { id: 100, created_at: "2024-12-10", account_id: 11, amount: 250000, description: "Loan amount credited", entry_type_id: 2, transaction_id: 46 },
    { id: 101, created_at: "2025-05-22", account_id: 0, amount: 300000, description: "Bank disbursed loan amount", entry_type_id: 1, transaction_id: 47 },
    { id: 102, created_at: "2025-05-22", account_id: 13, amount: 300000, description: "Loan amount credited", entry_type_id: 2, transaction_id: 47 },
    { id: 103, created_at: "2025-02-10", account_id: 1, amount: 10650.0, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 48 },
    { id: 104, created_at: "2025-02-10", account_id: 99, amount: 10650.0, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 48 },
    { id: 105, created_at: "2025-03-10", account_id: 1, amount: 10650.0, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 49 },
    { id: 106, created_at: "2025-03-10", account_id: 99, amount: 10650.0, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 49 },
    { id: 107, created_at: "2024-10-15", account_id: 2, amount: 19546.88, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 50 },
    { id: 108, created_at: "2024-10-15", account_id: 99, amount: 19546.88, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 50 },
    { id: 109, created_at: "2024-11-15", account_id: 2, amount: 19546.88, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 51 },
    { id: 110, created_at: "2024-11-15", account_id: 99, amount: 19546.88, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 51 },
    { id: 111, created_at: "2025-04-01", account_id: 3, amount: 10350.0, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 52 },
    { id: 112, created_at: "2025-04-01", account_id: 99, amount: 10350.0, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 52 },
    { id: 113, created_at: "2025-05-01", account_id: 3, amount: 10350.0, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 53 },
    { id: 114, created_at: "2025-05-01", account_id: 99, amount: 10350.0, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 53 },
    { id: 115, created_at: "2024-07-20", account_id: 4, amount: 17875.0, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 54 },
    { id: 116, created_at: "2024-07-20", account_id: 99, amount: 17875.0, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 54 },
    { id: 117, created_at: "2024-08-20", account_id: 4, amount: 17875.0, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 55 },
    { id: 118, created_at: "2024-08-20", account_id: 99, amount: 17875.0, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 55 },
    { id: 119, created_at: "2025-12-05", account_id: 5, amount: 7233.33, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 56 },
    { id: 120, created_at: "2025-12-05", account_id: 99, amount: 7233.33, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 56 },
    { id: 121, created_at: "2026-01-05", account_id: 5, amount: 7233.33, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 57 },
    { id: 122, created_at: "2026-01-05", account_id: 99, amount: 7233.33, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 57 },
    { id: 123, created_at: "2025-09-12", account_id: 7, amount: 5287.5, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 58 },
    { id: 124, created_at: "2025-09-12", account_id: 99, amount: 5287.5, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 58 },
    { id: 125, created_at: "2025-10-12", account_id: 7, amount: 5287.5, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 59 },
    { id: 126, created_at: "2025-10-12", account_id: 99, amount: 5287.5, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 59 },
    { id: 127, created_at: "2023-05-01", account_id: 8, amount: 15577.5, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 60 },
    { id: 128, created_at: "2023-05-01", account_id: 99, amount: 15577.5, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 60 },
    { id: 129, created_at: "2023-06-01", account_id: 8, amount: 15577.5, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 61 },
    { id: 130, created_at: "2023-06-01", account_id: 99, amount: 15577.5, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 61 },
    { id: 131, created_at: "2025-03-18", account_id: 10, amount: 7987.5, description: "Customer loan payment debited", entry_type_id: 1, transaction_id: 62 },
    { id: 132, created_at: "2025-03-18", account_id: 99, amount: 7987.5, description: "Bank loan payment received", entry_type_id: 2, transaction_id: 62 }
  ]
};

if (ENV.DATABASE_URL || (ENV.PGHOST && ENV.PGPASSWORD)) {
  try {
    const config = ENV.DATABASE_URL
      ? { connectionString: ENV.DATABASE_URL }
      : {
          user: ENV.PGUSER,
          host: ENV.PGHOST,
          database: ENV.PGDATABASE,
          password: ENV.PGPASSWORD,
          port: ENV.PGPORT,
        };

    pool = new Pool({
      ...config,
      connectionTimeoutMillis: 5000,
    });

    console.log("PostgreSQL connection pool initialized.");
  } catch (error) {
    console.warn("PostgreSQL connection initialization failed, activating In-Memory Fallback. Error:", error.message);
    useFallback = true;
  }
} else {
  console.log("No PostgreSQL credentials found. Starting in In-Memory DB Mode.");
  useFallback = true;
}

// Check real database connectivity, auto fallback if down
export const getPool = async () => {
  if (useFallback || !pool) return null;
  try {
    const client = await pool.connect();
    client.release();
    return pool;
  } catch (err) {
    console.warn(`PostgreSQL is down (${err.message}). Defaulting to Internal In-Memory SimDB.`);
    useFallback = true;
    return null;
  }
};

const simulateQuery = (text, params = []) => {
  const norm = text.toLowerCase();
  
  // Handle COUNT(*) queries
  if (norm.includes("count(*)") || norm.includes("count(1)")) {
    let tbl = "";
    if (norm.includes("from customer")) tbl = "customer";
    else if (norm.includes("from account_charge_line_item")) tbl = "account_charge_line_item";
    else if (norm.includes("from account_charge")) tbl = "account_charge";
    else if (norm.includes("from account")) tbl = "account";
    else if (norm.includes("from charge_item")) tbl = "charge_item";
    else if (norm.includes("from transaction")) tbl = "transaction_table";
    else if (norm.includes("from loan_schedule")) tbl = "loan_schedule";
    else if (norm.includes("from loan_payment_line_item")) tbl = "loan_payment_line_item";
    else if (norm.includes("from loan_payment")) tbl = "loan_payment";
    else if (norm.includes("from loan_disbursement_line_item")) tbl = "loan_disbursement_line_item";
    else if (norm.includes("from loan")) tbl = "loan";
    else if (norm.includes("from transfer_line_item")) tbl = "transfer_line_item";

    if (tbl && memoryDb[tbl]) {
      let filtered = memoryDb[tbl];
      if (norm.includes("loan_id = $1") && params[0] !== undefined) {
        filtered = filtered.filter(item => Number(item.loan_id) === Number(params[0]));
      } else if (norm.includes("account_id = $1") && params[0] !== undefined) {
        filtered = filtered.filter(item => Number(item.account_id) === Number(params[0]));
      } else if (norm.includes("customer_id = $1") && params[0] !== undefined) {
        filtered = filtered.filter(item => Number(item.customer_id) === Number(params[0]));
      }
      return { rows: [{ count: String(filtered.length) }] };
    }
    return { rows: [{ count: "0" }] };
  }

  // Handle SUM(...) queries (like general stats)
  if (norm.includes("sum(") && !norm.includes("group by") && !norm.includes("select l.*") && !norm.includes("select l.id")) {
    if (norm.includes("from loan_disbursement_line_item")) {
      let filtered = memoryDb.loan_disbursement_line_item;
      if (norm.includes("loan_id = $1") && params[0] !== undefined) {
        filtered = filtered.filter(item => Number(item.loan_id) === Number(params[0]));
      }
      const sumVal = filtered.reduce((acc, curr) => acc + (Number(curr.disbursement_amount) || 0), 0);
      return { rows: [{ total: String(sumVal), sum: String(sumVal) }] };
    }

  if (norm.includes("from loan_payment")) {
    let list = memoryDb.loan_payment.map(p => {
    const l = memoryDb.loan.find(loan => Number(loan.id) === Number(p.loan_id)) || {};
    const c = memoryDb.customer.find(cust => Number(cust.id) === Number(l.customer_id)) || {};

    return {
      ...p,
      loan_code: l.code || "",
      customer_name: c.name || "",
      customer_phone: c.phone_no || "",
      customer_address: c.address_line1 || ""
    };
  });

  if (norm.includes("loan_id = $1")) {
    list = list.filter(p => Number(p.loan_id) === Number(params[0]));
  }

  if (norm.includes("p.id = $1")) {
    const res = list.find(p => Number(p.id) === Number(params[0]));
    return { rows: res ? [res] : [] };
  }

  return { rows: list };
}

    let tbl = "";
    let col = "";
    if (norm.includes("from account")) {
      tbl = "account";
      col = "current_balance";
    } else if (norm.includes("from loan")) {
      tbl = "loan";
      col = "outstanding_balance";
    }
    
    if (tbl && col && memoryDb[tbl]) {
      const sumVal = memoryDb[tbl].reduce((acc, curr) => acc + (Number(curr[col]) || 0), 0);
      return { rows: [{ sum: String(sumVal), total: String(sumVal) }] };
    }
    return { rows: [{ sum: "0", total: "0" }] };
  }

  // INSERT / UPDATE / DELETE parses first
  if (norm.includes("insert into customer")) {
    const name = params[1], nrc = params[2], phone = params[3], ad1 = params[4], ad2 = params[5], dob = params[6];
    const code = params[0] || `CUS-00${memoryDb.customer.length + 1}`;
    const newItem = { id: memoryDb.customer.length + 1, code, name, nrc_no: nrc, phone_no: phone, address_line1: ad1, address_line2: ad2, date_of_birth: dob };
    memoryDb.customer.push(newItem);
    return { rows: [newItem] };
  }
  
  if (norm.includes("update customer")) {
    const id = Number(params[6]);
    const item = memoryDb.customer.find(c => c.id === id);
    if (item) {
      item.name = params[0] !== undefined ? params[0] : item.name;
      item.nrc_no = params[1] !== undefined ? params[1] : item.nrc_no;
      item.phone_no = params[2] !== undefined ? params[2] : item.phone_no;
      item.address_line1 = params[3] !== undefined ? params[3] : item.address_line1;
      item.address_line2 = params[4] !== undefined ? params[4] : item.address_line2;
      item.date_of_birth = params[5] !== undefined ? params[5] : item.date_of_birth;
    }
    return { rows: [item] };
  }

  if (norm.includes("delete from customer")) {
    const id = Number(params[0]);
    memoryDb.customer = memoryDb.customer.filter(c => c.id !== id);
    return { rows: [] };
  }

  if (norm.includes("insert into account")) {
    const account_no = params[0], date = params[1], status = params[2], balance = Number(params[3]), cust_id = Number(params[4]);
    const newItem = { id: memoryDb.account.length + 1, account_no, open_date: date, status, current_balance: balance, customer_id: cust_id };
    memoryDb.account.push(newItem);
    return { rows: [newItem] };
  }

  if (norm.includes("update account")) {
    // Check type of update using whitespace-independent comparison
    const stripped = norm.replace(/\s+/g, "");
    if (stripped.includes("current_balance=current_balance-$1") || stripped.includes("current_balance-$1")) {
      const amt = Number(params[0]);
      const id = Number(params[1]);
      const item = memoryDb.account.find(a => a.id === id);
      if (item) item.current_balance = Number((item.current_balance - amt).toFixed(2));
      return { rows: [item] };
    }
    if (stripped.includes("current_balance=current_balance+$1") || stripped.includes("current_balance+$1")) {
      const amt = Number(params[0]);
      const id = Number(params[1]);
      const item = memoryDb.account.find(a => a.id === id);
      if (item) item.current_balance = Number((item.current_balance + amt).toFixed(2));
      return { rows: [item] };
    }
    if (stripped.includes("status=$1,current_balance=$2") || stripped.includes("status=$1,current_balance=$2")) {
      const status = params[0];
      const balance = Number(params[1]);
      const id = Number(params[2]);
      const item = memoryDb.account.find(a => a.id === id);
      if (item) {
        item.status = status;
        item.current_balance = balance;
      }
      return { rows: [item] };
    }
  }

  if (norm.includes("delete from account")) {
    const id = Number(params[0]);
    memoryDb.account = memoryDb.account.filter(a => a.id !== id);
    return { rows: [] };
  }

  if (norm.includes("insert into account_charge ")) {
    const code = params[0], date = params[1], account_id = params[2], charge_id = params[3];
    const newItem = { id: memoryDb.account_charge.length + 1, code, date, account_id, charge_id };
    memoryDb.account_charge.push(newItem);
    return { rows: [newItem] };
  }

  if (norm.includes("insert into account_charge_line_item")) {
    const account_id = params[0], account_charge_id = params[1], description = params[2], date = params[3];
    const newItem = { id: memoryDb.account_charge_line_item.length + 1, account_id, account_charge_id, description, date };
    memoryDb.account_charge_line_item.push(newItem);
    return { rows: [newItem] };
  }

  if (norm.includes("insert into loan ") || norm.includes("insert into loan(")) {
    const code = params[0], act_id = params[1], cust_id = params[2], lt_id = params[3], rate = params[4], amt = params[5], s_date = params[6], term = params[7], status = params[8], out_bal = params[9];
    const newItem = { 
      id: memoryDb.loan.length + 1, 
      code, 
      account_id: Number(act_id), 
      customer_id: Number(cust_id), 
      loan_type_id: Number(lt_id), 
      interest_rate: Number(rate), 
      loan_amount: Number(amt), 
      start_date: s_date, 
      loan_term: Number(term), 
      loan_status: status || 'Active', 
      outstanding_balance: Number(out_bal) 
    };
    memoryDb.loan.push(newItem);
    return { rows: [newItem] };
  }

  if (norm.includes("update loan")) {
    if (norm.includes("loan_status = $1") || norm.includes("loan_status=$1")) {
      const status = params[0];
      const id = Number(params[1]);
      const item = memoryDb.loan.find(l => l.id === id);
      if (item) item.loan_status = status;
      return { rows: [item] };
    }
    if (norm.includes("outstanding_balance = outstanding_balance + $1")) {
      const amt = Number(params[0]);
      const id = Number(params[1]);
      const item = memoryDb.loan.find(l => l.id === id);
      if (item) item.outstanding_balance = Number((item.outstanding_balance + amt).toFixed(2));
      return { rows: [item] };
    }
    if (norm.includes("outstanding_balance = $1")) {
      const amt = Number(params[0]);
      const id = Number(params[1]);
      const item = memoryDb.loan.find(l => l.id === id);
      if (item) item.outstanding_balance = amt;
      return { rows: [item] };
    }
  }

  if (norm.includes("insert into loan_schedule")) {
    const code = params[0], loan_id = params[1], installment_no = params[2], due_date = params[3], amount_due = params[4], status = params[5];
    const newItem = { 
      id: memoryDb.loan_schedule.length + 1, 
      code, 
      loan_id: Number(loan_id), 
      installment_no: Number(installment_no), 
      due_date, 
      amount_due: Number(amount_due), 
      status: status || "Unpaid"
    };
    memoryDb.loan_schedule.push(newItem);
    return { rows: [newItem] };
  }

  if (norm.includes("update loan_schedule")) {
    const status = params[0];
    const id = Number(params[1]);
    const item = memoryDb.loan_schedule.find(s => s.id === id);
    if (item) item.status = status;
    return { rows: [item] };
  }

  if (norm.includes("insert into loan_disbursement_line_item")) {
    const code = params[0], loan_id = params[1], amt = params[2], date = params[3];
    const newItem = { 
      id: memoryDb.loan_disbursement_line_item.length + 1, 
      code, 
      loan_id: Number(loan_id), 
      disbursement_amount: Number(amt), 
      disbursement_date: date 
    };
    memoryDb.loan_disbursement_line_item.push(newItem);
    return { rows: [newItem] };
  }

  if (norm.includes("insert into loan_payment ")) {
    const code = params[0], loan_id = params[1], total_paid = params[2], outstanding = params[3], date = params[4];
    const newItem = { 
      id: memoryDb.loan_payment.length + 1, 
      code, 
      loan_id: Number(loan_id), 
      total_paid: Number(total_paid), 
      outstanding_balance: Number(outstanding), 
      payment_date: date 
    };
    memoryDb.loan_payment.push(newItem);
    return { rows: [newItem] };
  }

  if (norm.includes("insert into loan_payment_line_item")) {
    const lp_id = params[0], ls_id = params[1], amt = params[2], pr_amt = params[3], int_amt = params[4], rate = params[5];
    const newItem = { id: memoryDb.loan_payment_line_item.length + 1, loan_payment_id: lp_id, loan_schedule_id: ls_id, amount_paid: amt, principal_amount: pr_amt, interest_amount: int_amt, applied_interest_rate: rate };
    memoryDb.loan_payment_line_item.push(newItem);
    return { rows: [newItem] };
  }

  if (norm.includes("insert into transaction ")) {
    const code = params[0], amount = params[1], date = params[2], remark = params[3], type_id = params[4], batch_id = params[5], status_id = params[6];
    const newItem = { id: memoryDb.transaction_table.length + 1, transaction_code: code, amount, transaction_date: date, remark, transaction_type_id: type_id, batch_id, status_id };
    memoryDb.transaction_table.push(newItem);
    return { rows: [newItem] };
  }

  if (norm.includes("insert into transfer_line_item")) {
    const tx_id = params[0], act_id = params[1], entry_type_id = params[2], amount = params[3], desc = params[4];
    const newItem = { id: memoryDb.transfer_line_item.length + 1, transaction_id: tx_id, account_id: act_id, entry_type_id, amount, description: desc };
    memoryDb.transfer_line_item.push(newItem);
    return { rows: [newItem] };
  }

  if (norm.includes("insert into transfer_batch")) {
    const type = params[0], date = params[1], desc = params[2], status = params[3] || "Completed";
    const newItem = { id: memoryDb.transfer_batch.length + 1, status, batch_type: type, batch_date: date, description: desc };
    memoryDb.transfer_batch.push(newItem);
    return { rows: [newItem] };
  }

  // SELECT QUERIES with filtering support
  if (norm.includes("from customer")) {
    if (norm.includes("id = $1") || norm.includes("customer.id = $1")) {
      const res = memoryDb.customer.find(c => c.id === Number(params[0]));
      return { rows: res ? [res] : [] };
    }
    if (norm.includes("code = $1")) {
      const res = memoryDb.customer.find(c => c.code === params[0]);
      return { rows: res ? [res] : [] };
    }
    return { rows: memoryDb.customer };
  }

  if (norm.includes("from account")) {
    let accList = memoryDb.account.map(a => {
      const c = memoryDb.customer.find(cust => cust.id === a.customer_id) || {};
      return {
        ...a,
        customer_name: c.name,
        customer_code: c.code,
        customer_phone: c.phone_no,
        customer_nrc: c.nrc_no,
        customer_address: c.address_line1,
      };
    });

    if (norm.includes("account_no = $1")) {
      const res = accList.find(a => a.account_no === params[0]);
      return { rows: res ? [res] : [] };
    }
    if (norm.includes("customer_id = $1")) {
      const res = accList.filter(a => a.customer_id === Number(params[0]));
      return { rows: res };
    }
    if (norm.includes("a.id = $1") || norm.includes("id = $1")) {
      const res = accList.find(a => a.id === Number(params[0]));
      return { rows: res ? [res] : [] };
    }
    return { rows: accList };
  }

  if (norm.includes("from charge_item")) {
    return { rows: memoryDb.charge_item };
  }

  if (norm.includes("from account_charge")) {
    let list = memoryDb.account_charge.map(ac => {
      const ci = memoryDb.charge_item.find(item => Number(item.id) === Number(ac.charge_id)) || {};
      const li = memoryDb.account_charge_line_item.find(line =>
        Number(line.account_charge_id) === Number(ac.id) &&
        Number(line.account_id) === Number(ac.account_id)
      ) || {};

      return {
        ...ac,
        charge_type: ci.charge_type || "",
        charge_amount: Number(ci.charge_amount) || 0,
        description: li.description || "Service charge applied"
      };
    });

    if (norm.includes("account_id = $1")) {
      const accountId = Number(params[0]);
      list = list.filter(ac => Number(ac.account_id) === accountId);
    }

    return { rows: list };
  }

  if (norm.includes("from loan ") || norm.includes("from loan\n") || norm.includes("from loan l") || norm.includes("from loan lt") || (norm.includes("from loan") && !norm.includes("from loan_type") && !norm.includes("from loan_schedule") && !norm.includes("from loan_disbursement") && !norm.includes("from loan_payment"))) {
    if (norm.includes("group by lt.type_name")) {
      const groups = {};
      memoryDb.loan_type.forEach(lt => {
        groups[lt.type_name] = {
          type_name: lt.type_name,
          loan_count: 0,
          total_allocated: 0,
          total_outstanding: 0
        };
      });
      memoryDb.loan.forEach(l => {
        const lt = memoryDb.loan_type.find(t => Number(t.id) === Number(l.loan_type_id));
        if (lt && groups[lt.type_name]) {
          groups[lt.type_name].loan_count += 1;
          groups[lt.type_name].total_allocated += Number(l.loan_amount) || 0;
          groups[lt.type_name].total_outstanding += Number(l.outstanding_balance) || 0;
        }
      });
      return { rows: Object.values(groups) };
    }

    const results = memoryDb.loan.map(l => {
      const act = memoryDb.account.find(a => Number(a.id) === Number(l.account_id)) || {};
      const c = memoryDb.customer.find(cust => Number(cust.id) === Number(l.customer_id)) || {};
      const lt = memoryDb.loan_type.find(t => Number(t.id) === Number(l.loan_type_id)) || {};
      const disbursements = memoryDb.loan_disbursement_line_item.filter(d => Number(d.loan_id) === Number(l.id));
      const totalDisbursedAmt = disbursements.reduce((s, d) => s + (Number(d.disbursement_amount) || 0), 0);
      const remainingVal = Number(l.loan_amount) - totalDisbursedAmt;
      return {
        ...l,
        account_no: act.account_no,
        customer_name: c.name,
        customer_phone: c.phone_no,
        customer_address: c.address_line1,
        type_name: lt.type_name,
        loan_type_name: lt.type_name,
        default_interest_rate: lt.default_interest_rate,
        max_term: lt.max_term,
        max_loan_amount: lt.max_loan_amount,
        total_disbursed: totalDisbursedAmt,
        remaining_to_disburse: remainingVal
      };
    });

    if (norm.includes("l.id = $1") || norm.includes("id = $1")) {
      const res = results.find(l => Number(l.id) === Number(params[0]));
      return { rows: res ? [res] : [] };
    }
    if (norm.includes("customer_id = $1")) {
      const res = results.filter(l => Number(l.customer_id) === Number(params[0]));
      return { rows: res };
    }
    return { rows: results };
  }

  if (norm.includes("from loan_type")) {
    let list = memoryDb.loan_type;
    if (norm.includes("id = $1")) {
      const id = Number(params[0]);
      list = list.filter(t => t.id === id);
    }
    return { rows: list };
  }

  if (norm.includes("from loan_schedule")) {
    let res = memoryDb.loan_schedule.map(s => {
      const l = memoryDb.loan.find(loan => Number(loan.id) === Number(s.loan_id)) || {};
      const c = memoryDb.customer.find(cust => Number(cust.id) === Number(l.customer_id)) || {};

      return {
        ...s,
        amount_to_be_paid_back: Number(s.amount_due) || 0,
        loan_code: l.code || "",
        customer_name: c.name || ""
      };
    });

    if (norm.includes("loan_id = $1")) {
      res = res.filter(s => Number(s.loan_id) === Number(params[0]));
   }

    return { rows: res };
  }

  if (norm.includes("from loan_disbursement_line_item") || norm.includes("from loan_disbursement")) {
    let res = memoryDb.loan_disbursement_line_item.map(d => {
      const l = memoryDb.loan.find(loan => Number(loan.id) === Number(d.loan_id)) || {};
      const c = l.customer_id ? (memoryDb.customer.find(cust => Number(cust.id) === Number(l.customer_id)) || {}) : {};
      return {
        ...d,
        loan_code: l.code || "",
        customer_name: c.name || ""
      };
    });
    if (norm.includes("loan_id = $1")) {
      res = res.filter(d => Number(d.loan_id) === Number(params[0]));
    }
    return { rows: res };
  }

  if (norm.includes("from loan_payment_line_item")) {
    let res = memoryDb.loan_payment_line_item;
    if (norm.includes("loan_payment_id = $1")) {
      res = res.filter(li => li.loan_payment_id === Number(params[0]));
    }
    return { rows: res };
  }

  if (norm.includes("from loan_payment")) {
    let list = memoryDb.loan_payment.map(p => {
      const l = memoryDb.loan.find(loan => Number(loan.id) === Number(p.loan_id)) || {};
      const c = memoryDb.customer.find(cust => Number(cust.id) === Number(l.customer_id)) || {};

      return {
      ...p,
      loan_code: l.code || "",
      customer_name: c.name || "",
      customer_phone: c.phone_no || "",
      customer_address: c.address_line1 || ""
      };
    });

    if (norm.includes("loan_id = $1")) {
      list = list.filter(p => Number(p.loan_id) === Number(params[0]));
    }

    if (norm.includes("p.id = $1")) {
      const res = list.find(p => Number(p.id) === Number(params[0]));
      return { rows: res ? [res] : [] };
    }

    return { rows: list };
  } 

  if (norm.includes("from transaction")) {
    if (norm.includes("group by tt.code")) {
      const groups = {};
      memoryDb.transaction_type.forEach(tt => {
        groups[tt.code] = {
          type_name: tt.code,
          trans_count: 0,
          total_volume: 0
        };
      });
      memoryDb.transaction_table.forEach(t => {
        const tt = memoryDb.transaction_type.find(type => Number(type.id) === Number(t.transaction_type_id));
        if (tt && groups[tt.code]) {
          groups[tt.code].trans_count += 1;
          groups[tt.code].total_volume += Number(t.amount) || 0;
        }
      });
      return { rows: Object.values(groups) };
    }

    // Join details
    const list = memoryDb.transaction_table.map(t => {
      const tt = memoryDb.transaction_type.find(type => type.id === t.transaction_type_id) || {};
      const ts = memoryDb.transaction_status.find(status => status.id === t.status_id) || {};
      const tb = memoryDb.transfer_batch.find(batch => batch.id === t.batch_id) || {};
      return {
        ...t,
        description: t.remark,
        type_code: tt.code,
        type_description: tt.description,
        transaction_type: tt.code,
        status_code: ts.code,
        status_description: ts.description,
        batch_type: tb.batch_type,
        batch_date: tb.batch_date,
        batch_description: tb.description
      };
    });

    if (norm.includes("t.id = $1") || norm.includes("id = $1")) {
      const res = list.find(t => t.id === Number(params[0]));
      return { rows: res ? [res] : [] };
    }
    if (norm.includes("t.transaction_code = $1")) {
      const res = list.find(t => t.transaction_code === params[0]);
      return { rows: res ? [res] : [] };
    }
    return { rows: list };
  }

  if (norm.includes("from transfer_line_item")) {
    let res = memoryDb.transfer_line_item.map(li => {
      const a = memoryDb.account.find(acc => acc.id === li.account_id) || {};
      const c = memoryDb.customer.find(cust => cust.id === a.customer_id) || {};
      const et = memoryDb.entry_type.find(entry => entry.id === li.entry_type_id) || {};
      return {
        ...li,
        account_no: a.account_no,
        customer_name: c.name,
        entry_type_code: et.code
      };
    });
    if (norm.includes("li.transaction_id = $1") || norm.includes("transaction_id = $1")) {
      res = res.filter(li => li.transaction_id === Number(params[0]));
    }
    return { rows: res };
  }

  if (norm.includes("from transfer_batch")) {
    return { rows: memoryDb.transfer_batch };
  }

  if (norm.includes("from entry_type")) {
    if (norm.includes("code = $1")) {
      const res = memoryDb.entry_type.find(e => e.code.toLowerCase() === params[0].toLowerCase());
      return { rows: res ? [res] : [] };
    }
    return { rows: memoryDb.entry_type };
  }

  if (norm.includes("from transaction_type")) {
    if (norm.includes("code = $1")) {
      const res = memoryDb.transaction_type.find(e => e.code.toLowerCase() === params[0].toLowerCase());
      return { rows: res ? [res] : [] };
    }
    return { rows: memoryDb.transaction_type };
  }

  if (norm.includes("from transaction_status")) {
    if (norm.includes("code = $1")) {
      const res = memoryDb.transaction_status.find(e => e.code.toLowerCase() === params[0].toLowerCase());
      return { rows: res ? [res] : [] };
    }
    return { rows: memoryDb.transaction_status };
  }

  return { rows: [] };
};

// Expose standard API
export const query = async (text, params = []) => {
  if (useFallback || !pool) {
    return simulateQuery(text, params);
  }
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.warn("Database query error", error.message);
    throw error;
  }
};

// Transaction interface mockup
export const getTransaction = async () => {
  if (useFallback || !pool) {
    return {
      query: async (text, params = []) => simulateQuery(text, params),
      commit: async () => {},
      rollback: async () => {},
      release: () => {}
    };
  }
  try {
    const client = await pool.connect();
    await client.query("BEGIN");
    return {
      query: async (t, p) => client.query(t, p),
      commit: async () => { await client.query("COMMIT"); client.release(); },
      rollback: async () => { await client.query("ROLLBACK"); client.release(); },
      release: () => { client.release(); }
    };
  } catch (error) {
    console.warn("Transaction setup error, falling back to memory.", error.message);
    useFallback = true;
    return {
      query: async (text, params = []) => simulateQuery(text, params),
      commit: async () => {},
      rollback: async () => {},
      release: () => {}
    };
  }
};

export default {
  query,
  getPool,
  getTransaction,
  memoryDb // export raw states for utility mutators
};
