import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative sm:hidden">
      {/* ปุ่ม Hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-800 dark:text-white focus:outline-none"
      >
        {isOpen ? <X size={32} /> : <Menu size={32} />}
      </button>

      {/* เมนูที่แสดงเมื่อกดปุ่ม */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-lg"
        >
          <ul className="flex flex-col text-gray-800 dark:text-white">
            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              <a href="#">หน้าแรก</a>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              <a href="#">เกี่ยวกับเรา</a>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              <a href="#">บริการ</a>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              <a href="#">ติดต่อเรา</a>
            </li>
          </ul>
        </motion.div>
      )}
    </div>
  );
}
