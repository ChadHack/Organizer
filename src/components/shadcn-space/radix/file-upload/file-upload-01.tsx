import { cn } from "@/lib/utils"
import { Upload } from "lucide-react"
import { motion } from "motion/react"
import React, { useRef, useState } from "react"
import { useDropzone } from "react-dropzone"

const mainVariant = {
  initial: { x: 0, y: 0 },
  animate: { x: 20, y: -20, opacity: 0.9 },
}

const secondaryVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
}

interface FileUploadProps {
  onChange?: (files: File[]) => void
}

export const FileUploadStruc: React.FC<FileUploadProps> = ({ onChange }) => {
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
    onChange?.(newFiles)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: console.error,
  })

  const formatFileSize = (size: number) => (size / (1024 * 1024)).toFixed(2)

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString()

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="group/file relative block w-full cursor-pointer overflow-hidden rounded-lg p-6"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center">
          <div className="relative mx-auto w-full max-w-xl">
            {files.length > 0 ? (
              files.map((file, idx) => (
                <FileItem
                  key={file.name + idx}
                  file={file}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                  isFirst={idx === 0}
                />
              ))
            ) : (
              <EmptyState isDragActive={isDragActive} />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// File Item Component
interface FileItemProps {
  file: File
  formatFileSize: (size: number) => string
  formatDate: (timestamp: number) => string
  isFirst: boolean
}
const FileItem: React.FC<FileItemProps> = ({
  file,
  formatFileSize,
  formatDate,
  isFirst,
}) => (
  <motion.div
    layoutId={isFirst ? "file-upload" : `file-upload-${file.name}`}
    className={cn(
      "relative z-40 mx-auto mt-4 flex w-full flex-col items-start justify-start overflow-hidden rounded-md border bg-card p-4 shadow-sm md:h-24"
    )}
  >
    <div className="flex w-full items-center justify-between gap-4">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        layout
        className="max-w-xs truncate text-sm font-medium text-foreground"
      >
        {file.name}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        layout
        className="w-fit shrink-0 rounded-lg bg-muted px-2 py-1 text-xs font-medium text-muted-foreground shadow-sm"
      >
        {formatFileSize(file.size)} MB
      </motion.p>
    </div>
    <div className="mt-2 flex w-full flex-col items-start justify-between text-sm text-muted-foreground md:flex-row md:items-center">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        layout
        className="rounded-md bg-muted px-3 py-1 text-xs"
      >
        {file.type}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        layout
        className="text-sm"
      >
        modified {formatDate(file.lastModified)}
      </motion.p>
    </div>
  </motion.div>
)

// Empty State Component
interface EmptyStateProps {
  isDragActive: boolean
}
const EmptyState: React.FC<EmptyStateProps> = ({ isDragActive }) => (
  <>
    <motion.div
      layoutId="file-upload"
      variants={mainVariant}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      className={cn(
        "relative z-40 mx-auto mt-4 flex h-28 w-full max-w-32 items-center justify-center rounded-md border bg-card shadow-sm transition-shadow group-hover/file:shadow-xl"
      )}
    >
      {isDragActive ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center text-muted-foreground"
        >
          Drop it
          <Upload size={24} className="h-6 w-6 shrink-0 text-primary" />
        </motion.p>
      ) : (
        <Upload size={24} className="h-6 w-6 shrink-0 text-muted-foreground" />
      )}
    </motion.div>
    <motion.div
      variants={secondaryVariant}
      className="absolute inset-0 z-30 mx-auto mt-4 flex h-28 w-full max-w-32 items-center justify-center rounded-md border border-dashed border-primary/50 bg-primary/5 opacity-0"
    />
  </>
)

const FileUploadMotion = ({ setFile }: { setFile: (file: File[]) => void }) => {
  const handleFileUpload = (files: File[]) => {
    setFile(files)
  }
  return (
    <div className="mx-auto flex w-full max-w-4xl items-center justify-center rounded-xl border border-dashed border-muted bg-background p-4">
      <FileUploadStruc onChange={handleFileUpload} />
    </div>
  )
}

export default FileUploadMotion
