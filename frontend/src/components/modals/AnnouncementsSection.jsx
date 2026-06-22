import { useState } from "react";
import { faBullhorn, faPlus, faCircleNotch, faXmark, faUser, faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import toast from "react-hot-toast"; 

/**
 * View modal — opens when an announcement card is clicked.
 * Styled to match the section's neutral/zuccini + dark-mode palette.
 */
function AnnouncementViewModal({ announcement, onClose, onRequestDelete, isAdmin }) {
	if (!announcement) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm transition-all duration-500"
			onClick={onClose}
		>
			<div
				className="w-full max-w-lg overflow-hidden border border-gray-300 shadow-xl dark:border-gray-700 rounded-3xl bg-neutral-100 dark:bg-gray-900 transition-all duration-500"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="relative flex items-center gap-3 p-4 border-b border-gray-300 dark:border-gray-700 md:p-5">
					<FontAwesomeIcon icon={faBullhorn} className="p-2 text-zuccini-600 dark:text-white" />
					<h2 className="pr-8 text-md lg:text-xl font-semibold text-neutral-800 dark:text-white break-words">
						{announcement.announceTitle}
					</h2>

					<button
						onClick={onClose}
						aria-label="Close announcement"
						className="absolute flex items-center justify-center w-8 h-8 transition-all duration-500 rounded-full right-3 top-3 hover:bg-zuccini-600 active:bg-zuccini-500"
					>
						<FontAwesomeIcon icon={faXmark} className="text-neutral-800 dark:text-white" />
					</button>
				</div>

				{/* Body */}
				<div className="p-4 transition-all duration-500 rounded-lg md:p-5">
					<p className="mb-4 text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-300">
						{announcement.announceText}
					</p>

					<div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-gray-300 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
						<span className="flex items-center gap-2">
							<FontAwesomeIcon icon={faUser} className="text-zuccini-600" />
							{announcement.author}
						</span>
						<span className="flex items-center gap-2">
							<FontAwesomeIcon icon={faCalendarDays} className="text-zuccini-600" />
							{announcement.duration ? new Date(announcement.duration).toLocaleDateString() : "No date"}
						</span>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 p-4 border-t border-gray-300 dark:border-gray-700 bg-neutral-200 dark:bg-gray-950/50 md:p-5">
					{isAdmin && (
						<button
							onClick={() => {
								if (!isAdmin) {
									toast.error("Admins only");
									return;
								}
								onRequestDelete(announcement);
							}}
							className="px-3 py-1.5 text-xs text-red-600 transition-colors rounded hover:bg-red-100 dark:hover:bg-red-900"
						>
							Delete
						</button>
					)}
					<button
						onClick={onClose}
						className="px-4 py-1.5 text-sm transition-all duration-500 rounded-3xl text-neutral-800 dark:text-white hover:bg-zuccini-600 active:bg-zuccini-500"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}


function AnnouncementsSection({
	announcements,
	announcementsLoading,
	isAdmin,
	setShowAnnounceModal,
	setShowDeleteConfirm,
	selectedAnnouncement,
	setSelectedAnnouncement,
}) {
	const [showViewModal, setShowViewModal] = useState(false);

	const openAnnouncement = (announcement) => {
		setSelectedAnnouncement(announcement);
		setShowViewModal(true);
	};

	const closeAnnouncement = () => {
		setShowViewModal(false);
	};

	const requestDelete = (announcement) => {
		setSelectedAnnouncement(announcement);
		setShowDeleteConfirm(true);
		setShowViewModal(false); // close the view modal so the delete-confirm modal isn't stacked underneath it
	};

	return (
		<section className="relative mt-4 mb-8 p-3 md:p-5 text-neutral-800 border dark:border-gray-700 border-gray-300 rounded-3xl shadow-xl transition-all duration-500 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-900">
			<div className="flex flex-row items-center">
				<FontAwesomeIcon icon={faBullhorn} className="p-2 dark:text-white" />
				<h2 className="mb-1 font-semibold lg:mb-4 text-md lg:text-xl text-neutral-800 dark:text-white">Announcements</h2>
			</div>

			{isAdmin && (
				<div
					onClick={() => {
						if (!isAdmin) {
							toast.error("Admins only");
							return;
						}
						setShowAnnounceModal(true);
					}}
					className="absolute flex flex-row items-center justify-around px-2 py-0 transition-all duration-500 cursor-pointer md:px-5 md:py-1 top-4 md:top-5 right-5 rounded-3xl hover:bg-zuccini-600 active:bg-zuccini-500"
				>
					<FontAwesomeIcon icon={faPlus} className="mr-2 dark:text-white" />
					<h1 className="text-lg dark:text-white">New</h1>
				</div>
			)}

			<div className="p-4 transition-all duration-500 rounded-lg bg-neutral-300 dark:bg-gray-950/50">
				{announcementsLoading ? (
					<div className="flex h-full justify-center align-center">
						<FontAwesomeIcon icon={faCircleNotch} className="animate-spin font-light place-self-center text-center text-gray-700 transition-all duration-500 dark:text-white" />
						<p className="p-5 font-light place-self-center text-center text-gray-700 transition-all duration-500 dark:text-white">
							Loading Announcements...
						</p>
					</div>
				) : announcements && announcements.length > 0 ? (
					<div className="space-y-3 max-h-[400px] overflow-y-auto">
						{announcements.map((announcement, index) => (
							<div
								key={index}
								onClick={() => openAnnouncement(announcement)}
								className="p-2 transition-all duration-500 bg-gray-200 border border-gray-300 rounded-lg shadow-sm cursor-pointer md:p-4 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700"
							>
								<div className="flex flex-col items-start justify-between mb-2 md:flex-row">
									<h3 className="font-semibold text-gray-800 dark:text-white">{announcement.announceTitle}</h3>
									<div className="flex items-center gap-2">
										<span className="text-sm text-gray-500 dark:text-gray-400">
											{announcement.duration ? new Date(announcement.duration).toLocaleDateString() : "No date"}
										</span>									
									</div>
								</div>

								<p className="mb-2 text-sm text-gray-600 dark:text-gray-300 truncate">{announcement.announceText}</p>
								<p className="text-xs text-gray-500 dark:text-gray-400">By: {announcement.author}</p>
							</div>
						))}
					</div>
				) : (
					<p className="p-5 font-light text-center text-gray-700 transition-all duration-500 dark:text-white">No new announcements</p>
				)}
			</div>

			{showViewModal && (
				<AnnouncementViewModal
					announcement={selectedAnnouncement}
					onClose={closeAnnouncement}
					onRequestDelete={requestDelete}
					isAdmin={isAdmin}
				/>
			)}
		</section>
	);
}

export default AnnouncementsSection;